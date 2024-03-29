module.exports = class TechniqueModel {
  constructor(id, name, platforms, url, dataSource, description, score, tags) {
    this.id = id;
    this.name = name;
    this.platforms = platforms;
    this.url = url;
    this.data_source = dataSource;
    this.description = description;
    this.score = score;
    this.tags = tags;
    this.has_sub_technique = false;
  }
};