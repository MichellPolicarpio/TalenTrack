import { mapAzureRolesToUserRole } from "@/lib/map-azure-role";
import { sql, runWithPool } from "@/lib/db";
import { encryptData, decryptData } from "@/lib/crypto";
import type { Employee, UpsertEmployeeInput } from "@/lib/db/types";

async function mapRowToEmployee(row: Record<string, unknown>): Promise<Employee> {
  return {
    id: String(row.Id),
    entraObjectId: String(row.EntraObjectId),
    displayName: String(row.DisplayName ?? ""),
    corporateEmail: String(row.CorporateEmail ?? ""),
    appRole: mapAzureRolesToUserRole(
      typeof row.AppRole === "string"
        ? [row.AppRole]
        : undefined,
    ),
    createdAt: row.CreatedAt as Date,
    updatedAt: row.UpdatedAt as Date,
    isActive: Boolean(row.IsActive),
  };
}

async function fetchEmployeeByEntraIdWithPool(
  pool: sql.ConnectionPool,
  entraObjectId: string,
): Promise<Employee | null> {
  const request = pool.request();
  request.input("entraObjectId", sql.NVarChar(128), entraObjectId);

  const result = await request.query(`
    SELECT
      CAST(Id AS NVARCHAR(36)) AS Id,
      EntraObjectId,
      DisplayName,
      CorporateEmail,
      AppRole,
      CreatedAt,
      UpdatedAt,
      IsActive
    FROM dbo.Employees
    WHERE EntraObjectId = @entraObjectId
  `);

  const row = result.recordset[0] as Record<string, unknown> | undefined;
  if (!row) {
    return null;
  }
  return await mapRowToEmployee(row);
}

async function fetchEmployeeByEmailWithPool(
  pool: sql.ConnectionPool,
  corporateEmail: string,
): Promise<Employee | null> {
  const request = pool.request();
  request.input("corporateEmail", sql.NVarChar(320), corporateEmail);

  const result = await request.query(`
    SELECT
      CAST(Id AS NVARCHAR(36)) AS Id,
      EntraObjectId,
      DisplayName,
      CorporateEmail,
      AppRole,
      CreatedAt,
      UpdatedAt,
      IsActive
    FROM dbo.Employees
    WHERE CorporateEmail = @corporateEmail
  `);

  const row = result.recordset[0] as Record<string, unknown> | undefined;
  if (!row) {
    return null;
  }
  return await mapRowToEmployee(row);
}

export async function getEmployeeByEntraId(
  entraObjectId: string,
): Promise<Employee | null> {
  return runWithPool((pool) =>
    fetchEmployeeByEntraIdWithPool(pool, entraObjectId),
  );
}

export async function upsertEmployee(
  data: UpsertEmployeeInput,
): Promise<Employee> {
  return runWithPool(async (pool) => {
    const existingByEntra = await fetchEmployeeByEntraIdWithPool(
      pool,
      data.entraObjectId,
    );
    const existingByEmail =
      existingByEntra ??
      (await fetchEmployeeByEmailWithPool(pool, data.corporateEmail));
    const existing = existingByEmail;

    if (existing) {
      const emailForUpdate = data.corporateEmail;
      const updateReq = pool.request();
      updateReq.input("employeeId", sql.UniqueIdentifier, existing.id);
      updateReq.input("entraObjectId", sql.NVarChar(128), data.entraObjectId);
      updateReq.input("displayName", sql.NVarChar(200), data.displayName);
      updateReq.input("corporateEmail", sql.NVarChar(320), emailForUpdate);
      updateReq.input("appRole", sql.NVarChar(50), data.appRole);
      await updateReq.query(`
        UPDATE dbo.Employees
        SET
          EntraObjectId = @entraObjectId,
          DisplayName = @displayName,
          CorporateEmail = @corporateEmail,
          AppRole = @appRole,
          UpdatedAt = SYSUTCDATETIME()
        WHERE Id = @employeeId
      `);
      const updated = await fetchEmployeeByEntraIdWithPool(
        pool,
        data.entraObjectId,
      );
      if (!updated) {
        throw new Error("Employee not found after update");
      }
      return updated;
    }

    const emailForInsert = data.corporateEmail;
    const insertReq = pool.request();
    insertReq.input("entraObjectId", sql.NVarChar(128), data.entraObjectId);
    insertReq.input("displayName", sql.NVarChar(200), data.displayName);
    insertReq.input("corporateEmail", sql.NVarChar(320), emailForInsert);
    insertReq.input("appRole", sql.NVarChar(50), data.appRole);

    const insertResult = await insertReq.query(`
      INSERT INTO dbo.Employees (
        Id,
        EntraObjectId,
        DisplayName,
        CorporateEmail,
        AppRole,
        CreatedAt,
        UpdatedAt,
        IsActive
      )
      OUTPUT
        CAST(INSERTED.Id AS NVARCHAR(36)) AS Id,
        INSERTED.EntraObjectId,
        INSERTED.DisplayName,
        INSERTED.CorporateEmail,
        INSERTED.AppRole,
        INSERTED.CreatedAt,
        INSERTED.UpdatedAt,
        INSERTED.IsActive
      VALUES (
        NEWID(),
        @entraObjectId,
        @displayName,
        @corporateEmail,
        @appRole,
        SYSUTCDATETIME(),
        SYSUTCDATETIME(),
        1
      )
    `);

    const inserted = insertResult.recordset[0] as Record<string, unknown>;
    return await mapRowToEmployee(inserted);
  });
}
