// Pet module entry point
module.exports = {
  routes: require('./routes'),
  controllers: {
    pet: require('./controllers/petController'),
    core: require('./controllers/coreController'),
    centralizedPet: require('./controllers/centralizedPetController'),
    modules: require('./controllers/modulesController')
  },
  services: {
    pet: require('./services/petService')
  }
};