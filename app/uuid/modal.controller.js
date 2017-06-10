(function() {
  'use strict';

  angular.module('app.model').controller('ModalController', ModalController);

  ModalController.$inject = [ 'modelService', '$uibModalInstance', 'parentCtrl', 'config' ];

  function ModalController(modelService, uibModalInstance, parentCtrl, config) {
    this._modelService = modelService;
    this._modalInstance = uibModalInstance;
    this.parentCtrl = parentCtrl;
    if (typeof config !== 'undefined' && config !== null) {
      this._modelService.init(this, config);
    }
  }

  ModalController.prototype.set = function(key, val, dismiss) {
    this._modelService.set(this.parentCtrl, key, val);
    if (dismiss !== false) {
      this.cancel();
    }
  };

  ModalController.prototype.ok = function() {
    this._modalInstance.close();
  };

  ModalController.prototype.cancel = function() {
    this._modalInstance.dismiss('cancel');
  };

})();
