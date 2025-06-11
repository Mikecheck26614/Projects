'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    // Step 1: Validate existing onboarding data
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM "Profiles"
          WHERE "onboarding" IS NOT NULL
          AND "onboarding" != ''
          AND "onboarding" !~ '^{.*}$'
        ) THEN
          RAISE EXCEPTION 'Invalid JSON data in onboarding column';
        END IF;
      END $$;
    `);

    // Step 2: Alter onboarding column to JSON
    await queryInterface.sequelize.query(`
      ALTER TABLE "Profiles"
      ALTER COLUMN "onboarding" TYPE JSON
      USING (CASE
        WHEN "onboarding" IS NULL OR "onboarding" = '' THEN '{}'
        ELSE "onboarding"::json
      END);
    `);

    // Step 3: Set default value and not null constraint
    await queryInterface.changeColumn('Profiles', 'onboarding', {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: '{}',
    });
  },

  down: async (queryInterface, DataTypes) => {
    // Revert to TEXT
    await queryInterface.changeColumn('Profiles', 'onboarding', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: JSON.stringify({}),
    });
  },
};