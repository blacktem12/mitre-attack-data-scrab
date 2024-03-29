const mitreAttackUtil = require('./mitre-attack-utils');
const TacticModel = require('../model/tactic-model');
const TechniqueModel = require('../model/technique-model');
const SubTechniqueModel = require('../model/sub-technique-model');

class Parser {
  constructor() {
  }

  // Public Property
  parsedTacticData = [];
  parsedTechniqueData = [];
  parsedSubTechniqueData = [];
  parsedTechniqueDataByTactic = [];

  // Private Property
  #data = null;
  

  async parseData() {
    this.#data = (await mitreAttackUtil.downloadMitreAttack()).objects;

    this.#removeRevokedDeprecated();
    this.#setTactics();
    this.#setTechniques();
    this.#setSubTechniques();
    this.#setHasSubTechnique();
  }

  #removeRevokedDeprecated() {
    this.#data = this.#data.filter(element => !element.x_mitre_deprecated && !element.revoked);
  }

  #setTactics() {
    const tactics = this.#data.filter(element => element.type == 'x-mitre-tactic');

    for (let tactic of tactics) {
      const reference = this.#getExternalReferenceIdAndUrl(tactic);

      this.parsedTacticData.push(new TacticModel(reference.id, tactic.name, tactic.x_mitre_shortname, reference.url));
    }
  }

  #setTechniques() {
    const techniques = this.#data.filter(element => element.type == 'attack-pattern' && !element.x_mitre_is_subtechnique);

    for (let technique of techniques) {
      const reference = this.#getExternalReferenceIdAndUrl(technique);
      const platforms = technique.x_mitre_platforms ? technique.x_mitre_platforms.join(', ') : '';
      const dataSource = technique.x_mitre_data_sources ? technique.x_mitre_data_sources.join(', ') : '';

      this.parsedTechniqueData.push(
        new TechniqueModel(
          reference.id,
          technique.name,
          platforms,
          reference.url,
          dataSource,
          technique.description,
          this.#getScore(technique),
          this.#getTags(technique)
        )
      );
    }

    this.parsedTechniqueData = this.parsedTechniqueData.sort(this.#compare);
  }

  #setSubTechniques() {
    const subTechniques = this.#data.filter(element => element.type == 'attack-pattern' && element.x_mitre_is_subtechnique);

    for (let subTechnique of subTechniques) {
      const reference = this.#getExternalReferenceIdAndUrl(subTechnique);
      const platforms = subTechnique.x_mitre_platforms ? subTechnique.x_mitre_platforms.join(', ') : '';
      const dataSource = subTechnique.x_mitre_data_sources ? subTechnique.x_mitre_data_sources.join(', ') : '';

      this.parsedSubTechniqueData.push(
        new SubTechniqueModel(
          reference.id,
          reference.id.split('.')[0],
          subTechnique.name,
          platforms,
          reference.url,
          dataSource,
          subTechnique.description,
          this.#getScore(subTechnique)
        )
      );
    }

    this.parsedSubTechniqueData = this.parsedSubTechniqueData.sort(this.#compare);
  }

  #setTechniqueDataByTactic() {
    const techniques = this.#data.filter(element => element.type == 'attack-pattern' && !element.x_mitre_is_subtechnique);
    const result = [];

    for (let tactic of this.parsedTacticData) {
      result = result.concat(techniques.filter(element => element.kill_chain_phases && element.kill_chain_phases))
    }

    for (let technique of techniques) {
      const reference = this.#getExternalReferenceIdAndUrl(technique);
      const platforms = technique.x_mitre_platforms ? technique.x_mitre_platforms.join(', ') : '';
      const dataSource = technique.x_mitre_data_sources ? technique.x_mitre_data_sources.join(', ') : '';

      this.parsedTechniqueData.push(
        new TechniqueModel(
          reference.id,
          technique.name,
          platforms,
          reference.url,
          dataSource,
          technique.description,
          this.#getScore(technique),
          this.#getTags(technique)
        )
      );
    }

    this.parsedTechniqueData = this.parsedTechniqueData.sort(this.#compare);
  }

  #setHasSubTechnique() {
    for (let technique of this.parsedTechniqueData) {
      technique.has_sub_technique = this.parsedSubTechniqueData.filter(element => element.technique_id == technique.id).length > 0;
    }
  }

  #getExternalReferenceIdAndUrl(obj) {
    const externalReference = obj.external_references.filter(element => element.source_name == 'mitre-attack')[0];

    return { id: externalReference.external_id, url: externalReference.url };
  }

  #getScore(obj) {
    const relationships = this.#data.filter(element => element.type == 'relationship');

    return relationships.filter(element => element.relationship_type == 'uses' && element.target_ref == obj.id).length;

    // Mitigate, Detect, Reference Example
    // const result = {
    //   procedureExampleCount: relationships.filter(element => element.relationship_type == 'uses' && element.target_ref == obj.id).length,
    //   mitigationCount: relationships.filter(element => element.relationship_type == 'mitigates' && element.target_ref == obj.id).length,
    //   detectionCount: relationships.filter(element => element.relationship_type == 'detects' && element.target_ref == obj.id).length,
    //   referenceCount: obj.external_references.filter(element => element.source_name != 'mitre-attack').length
    // };

    // return result;
  }

  #getTags(obj) {
    let tags = '';

    if (obj.kill_chain_phases) {
      const mitreAttackKillChains = obj.kill_chain_phases.filter(element => element.kill_chain_name == 'mitre-attack');
      const data = [];

      for (let mitreAttackKillChain of mitreAttackKillChains) {
        data.push(mitreAttackKillChain.phase_name);
      }

      tags = data;
    }

    return tags;
  }

  #compare(a, b) {
    const regex = new RegExp(/\d+/, 'g');
    const prev = parseInt(a.id.match(regex).join(''));
    const next = parseInt(b.id.match(regex).join(''));

    if (prev < next) {
      return -1;
    } else if (prev > next) {
      return 1;
    } else {
      return 0;
    }
  }
}

module.exports = new Parser();