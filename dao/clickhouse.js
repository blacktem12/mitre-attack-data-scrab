const { createClient } = require('@clickhouse/client');

const options = {
  host: 'Your Connection String',
  connect_timeout: 180000,
  request_timeout: 180000,
  max_open_connections: 10,
  application: 'Your Application Name',
  database: 'Your Database Name'
};

const queries = {
  tactic: `CREATE TABLE IF NOT EXISTS tactic
  (
      id              String  NOT NULL COMMENT 'external_id',
      name            String  NOT NULL COMMENT 'name',
      short_name      String  NOT NULL COMMENT 'x_mitre_shortname',
      url             String  NOT NULL COMMENT 'external_references.url',
      description     String  NOT NULL COMMENT 'description',
  ) ENGINE = MergeTree
    PRIMARY KEY(id)
    COMMENT 'Mitre Att&ck Tactics'`,

  technique: `CREATE TABLE IF NOT EXISTS technique
  (
      id                  String          NOT NULL COMMENT 'external_id',
      name                String          NOT NULL COMMENT 'name',
      platforms           String          NOT NULL COMMENT 'x_mitre_platforms',
      url                 String          NOT NULL COMMENT 'external_references.url',
      data_source         String          NOT NULL COMMENT 'x_mitre_data_sources',
      description         String          NOT NULL COMMENT 'description',
      score               UInt16          NOT NULL COMMENT 'Procedure Example Count',
      tags                Array(String)   NOT NULL COMMENT 'tactic.id',
      has_sub_technique   BOOLEAN         NOT NULL COMMENT 'Has sub technique'
  ) ENGINE = MergeTree
    PRIMARY KEY(id)
    COMMENT 'Mitre Att&ck Techniques'`,

  subTechnique: `CREATE TABLE IF NOT EXISTS sub_technique
  (
      id                  String  NOT NULL COMMENT 'external_id',
      technique_id        String  NOT NULL COMMENT 'technique.id',
      name                String  NOT NULL COMMENT 'name',
      platforms           String  NOT NULL COMMENT 'x_mitre_platforms',
      url                 String  NOT NULL COMMENT 'external_references.url',
      data_source         String  NOT NULL COMMENT 'x_mitre_data_sources',
      description         String  NOT NULL COMMENT 'description',
      score               UInt16  NOT NULL COMMENT 'Procedure Example Count'
  ) ENGINE = MergeTree
    PRIMARY KEY(id)
    COMMENT 'Mitre Att&ck Sub Techniques'`
};

module.exports = class ClickHouse {
  constructor() {
  }

  createMitreAttackTable = async () => {
    const clickhouseClient = createClient(options);
    
    for (let property in queries) {
      await clickhouseClient.command({ query: queries[property] });
    }

    await clickhouseClient.close();
  }

  truncateMitreAttackTable = async () => {
    const clickhouseClient = createClient(options);
    const queries = ['TRUNCATE TABLE tactic', 'TRUNCATE TABLE technique', 'TRUNCATE TABLE sub_technique'];

    for (let query of queries) {
      await clickhouseClient.command({ query: query });
    }

    clickhouseClient.close();
  }

  insertMitreAttackData = async (tactics, techniques, subTecniques) => {
    const config = Object.assign({}, options);
    config.clickhouse_settings = {
      async_insert: true,
      wait_for_async_insert: true
    };

    const clickhouseClient = createClient(config);
    await clickhouseClient.insert({
      table: 'tactic',
      values: tactics,
      format: 'JSONEachRow'
    });

    await clickhouseClient.insert({
      table: 'technique',
      values: techniques,
      format: 'JSONEachRow'
    });

    await clickhouseClient.insert({
      table: 'sub_technique',
      values: subTecniques,
      format: 'JSONEachRow'
    });

    await clickhouseClient.close();
  }
}