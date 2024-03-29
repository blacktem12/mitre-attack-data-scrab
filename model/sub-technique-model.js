module.exports = class SubTechniqueModel {
  constructor(id, techniqueId, name, platforms, url, dataSource, description, score) {
    this.id = id;
    this.technique_id = techniqueId;
    this.name = name;
    this.platforms = platforms;
    this.url = url;
    this.data_source = dataSource;
    this.description = description;
    this.score = score;
  }
};