const request = require('request-promise');
const options = {
  headers: {
    'User-Agent': 'Mitre-Attack-Data-Collector'
  }
};

const mitreAttackUtil = {
  getVersion: async () => {
    const result = await request.get('https://api.github.com/repos/mitre/cti/git/refs/tags', options);
  
    const tags = JSON.parse(result);
    const attackTags = tags.filter(element => element.ref.includes('ATT&CK-v'));
  
    let version = parseFloat([...attackTags[0].ref.matchAll(/\d+/g)].join('.'));
  
    for (let i = 1; i < attackTags.length; i++) {
      let criteria = parseFloat([...attackTags[i].ref.matchAll(/\d+/g)].join('.'));
  
      if (version < criteria) {
        version = criteria;
      }
    }
  
    return version;
  },
  downloadMitreAttack: async () => {
    const version = await mitreAttackUtil.getVersion();
    const result = await request.get(`https://raw.githubusercontent.com/mitre/cti/ATT%26CK-v${version}/enterprise-attack/enterprise-attack.json`);
    const attacks = JSON.parse(result);
    
    return attacks;
  }
};

module.exports = mitreAttackUtil;