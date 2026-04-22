import { sql, runWithPool } from "@/lib/db";
import type { GlobalSetting } from "@/lib/db/types";

export async function getGlobalSettings(): Promise<Record<string, string>> {
  return runWithPool(async (pool) => {
    const result = await pool.request().query(`
      SELECT PreferenceKey, PreferenceValue
      FROM dbo.GlobalSettings
    `);

    const settings: Record<string, string> = {};
    result.recordset.forEach((row: any) => {
      settings[row.PreferenceKey] = row.PreferenceValue;
    });

    return settings;
  });
}

export async function updateGlobalSetting(
  key: string,
  value: string,
  userId?: string
): Promise<void> {
  return runWithPool(async (pool) => {
    const request = pool.request();
    request.input("key", sql.NVarChar(100), key);
    request.input("value", sql.NVarChar(sql.MAX), value);
    request.input("userId", sql.UniqueIdentifier, userId || null);

    await request.query(`
      IF EXISTS (SELECT 1 FROM dbo.GlobalSettings WHERE PreferenceKey = @key)
      BEGIN
        UPDATE dbo.GlobalSettings
        SET PreferenceValue = @value,
            UpdatedAt = SYSUTCDATETIME(),
            UpdatedBy = @userId
        WHERE PreferenceKey = @key
      END
      ELSE
      BEGIN
        INSERT INTO dbo.GlobalSettings (PreferenceKey, PreferenceValue, UpdatedAt, UpdatedBy)
        VALUES (@key, @value, SYSUTCDATETIME(), @userId)
      END
    `);
  });
}
