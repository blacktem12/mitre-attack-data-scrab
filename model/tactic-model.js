module.exports = class TacticModel {
  constructor(id, name, shortName, url, description) {
    this.id = id;
    this.name = name;
    this.short_name = shortName;
    this.url = url;
    this.description = description;
  }
};