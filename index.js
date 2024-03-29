const parser = require('./utils/parser');
const ClickHouse = require('./dao/clickhouse');

const initialize = async () => {
  const clickHouse = new ClickHouse();
  await clickHouse.createMitreAttackTable();
  await clickHouse.truncateMitreAttackTable();

  await parser.parseData();
  await clickHouse.insertMitreAttackData(parser.parsedTacticData, parser.parsedTechniqueData, parser.parsedSubTechniqueData);

  console.log('Done');
}

initialize();