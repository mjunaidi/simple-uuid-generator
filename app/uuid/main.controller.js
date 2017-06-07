(function() {
  'use strict';

  angular.module('app.model').controller('MainController', MainController);

  MainController.$inject = [ 'modelService', 'themeService', 'storageService',
              '$modal', '$document', '$crypto', '$http', '$scope', '$location',
              '$timeout', 'hotkeys', 'uuid4'
            ];

  var DEFAULT_KEY = '';
  var ALPHABETS = 'abcdefghijklmnopqrstuvwxyz';

  function MainController(modelService, themeService, storageService, modal,
          document, crypto, http, scope, location, timeout, hotkeys, uuid4) {
    this._modelService = modelService;
    this._themeService = themeService;
    this._storageService = storageService;
    this._modal = modal;
    this._document = document;
    this._crypto = crypto;
    this._http = http;
    this._scope = scope;
    this._location = location;
    this._timeout = timeout;
    this._hotkeys = hotkeys;
    this._uuid4 = uuid4;

    this._initHeader();
    // _initBody called with ng-init in each page
    //this._initBody();
  }

  MainController.prototype._initHeader = function() {
    this.mk = 'trendcrypt';
    this.key = '';
    this.input = '**This** _is_ \n## a \n# Secret Message';
    this.val = "";
    this.markdown = true;

    this.navbar = {
      templateUrl : '../app/uuid/html/navbar.html',
      /*pages: [
        {
          "name" : "Home", "path" : "/", "ra" : false
        }, {
          "name" : "Encrypt", "path" : "/enc", "ra" : true
        }, {
          "name" : "Decrypt", "path" : "/dec", "ra" : true
        }, {
          "name" : "UUID", "path" : "/uuid", "ra" : true
        }, {
          "name" : "Experiment", "path" : "/exp", "ra" : true
        }
      ]*/
    };

    //this.themes = this._themeService.themes();
    this.themes = [ "default", "cerulean", "cosmo", "cyborg", "darkly", "flatly",
              "journal", "lumen", "paper", "readable", "sandstone", "simplex",
              "slate", "solar", "spacelab", "superhero", "united", "yeti" ]; // zero-index
    this._themeService._themes = this.themes;
    this.store('theme', this._themeService.pick(8));

    this.aboutOpts = {
      templateUrl : '../app/uuid/html/about.html',
      config : function() {
        return {
          'get' : {
            'paths' : [ '../app/uuid/json/about.json' ],
            'key' : 'init'
          }
        };
      }
    };

    // You can pass it an object.  This hotkey will not be unbound unless manually removed
    // using the hotkeys.del() method
    this._hotkeys.add({
      combo: 'ctrl+v',
      description: 'Paste from clipboard',
      callback: function() {
        console.log('ctrl+v');
      }
    });
  };

  MainController.prototype._initBody = function() {
    if (this._location.path() === '/') {
      this.generateUuid();
    }

    if (this._location.path() === '/uuid') {
      this.generateUuid();
    }
  };

  MainController.prototype.generateUuid = function() {
    this.uuid = this._uuid4.generate();
  };

  MainController.prototype.uuidCopied = function(e) {
    this.isCopied = true;
    var ctrl = this;
    this._timeout(function() {
        ctrl.isCopied = false;
      }, 1200
    );
    e.clearSelection();
  };

  MainController.prototype.save = function(str) {
    if (typeof str === 'string' && str.trim().length > 0) {
      str = str.trim();
      var exist = false;
      for ( var i in this.saved) {
        var entry = this.saved[i];
        if (entry === str) {
          exist = true;
          break;
        }
      }
      if (exist === false) {
        this.saved.push(str);
        this.set('saved', this.saved);
      }
    }
  };

  MainController.prototype.remove = function(str) {
    if (typeof str === 'number') {
      this.saved.splice(str, 1);
      if (this.saved.length <= 0) {
        this.saved = DEFAULT_LIST;
      }
      this.set('saved', this.saved);
    } else if (typeof str === 'string') {
      var exist = false;
      for ( var i in this.saved) {
        var entry = this.saved[i];
        if (entry === str) {
          this.saved.splice(i, 1);
          exist = true;
          break;
        }
      }
      if (exist === true) {
        if (this.saved.length <= 0) {
          this.saved = _.map(DEFAULT_LIST, _.clone);
        }
        this.set('saved', this.saved);
      }
    }
  };

  MainController.prototype._process = function() {
    this.result = _parse(this.input, ALPHABETS);
  };

  MainController.prototype._reverse = function() {
    this.input = _secret(this.result, ALPHABETS);
  };

  function _parse(str, list) {
    var words = str.split(' ');
    var sentence = '';
    for ( var i in words) {
      var word = words[i];
      var chars = word.split('.');
      var actualWord = '';
      for ( var j in chars) {
        var char = chars[j];
        if (typeof char !== 'undefined' && char.length > 0) {
          var ind = parseInt(char);
          if (ind >= 1 && ind <= 26) {
            ind--;
            var actualChar = list.charAt(ind);
            actualWord += actualChar;
          } else {
            actualWord += '?';
          }
        }
      }
      sentence += actualWord + ' ';
    }
    return sentence.trim();
  }

  function _secret(str, list) {
    var words = str.split(' ');
    var secret = '';
    for ( var i in words) {
      var word = words[i];
      var chars = word.split('');
      var secretWord = '';
      for ( var j in chars) {
        var char = chars[j];
        for ( var a in list) {
          if (char == list[a]) {
            if (secretWord.length > 0) {
              secretWord += '.';
            }
            var secretChar = parseInt(a) + 1;
            secretWord += secretChar;
          }
        }
      }
      secret += secretWord + ' ';
    }
    return secret.trim();
  }

  MainController.prototype.set = function(key, val) {
    this._modelService.set(this, key, val);
  };

  MainController.prototype.store = function(key, val) {
    var storeKey = 'data_' + key;
    this._modelService.watch(this, [ key ], 'store' + key, (function() {
      this._storageService.saveObject(this[key], storeKey);
    }).bind(this));
    var stored = this._storageService.loadObject(storeKey);
    if (typeof stored !== 'undefined' && stored !== null) {
      if (typeof stored.length !== 'undefined' && stored.length > 0) {
        this[key] = stored;
      } else if (typeof stored === 'boolean') {
        this[key] = stored;
      }
    }
    if (typeof this[key] === 'undefined') {
      this[key] = val;
    }
  };

  MainController.prototype.openModal = function() {
    this.modal({
      templateUrl: '../app/uuid/html/modal.html'
    });
  };

  MainController.prototype.modal = function(args) {
    if (typeof args === 'undefined') {
      args = {};
    }
    if (typeof args === 'object') {
      args.animation = args.animation ? args.animation : true;
      args.size = args.size ? args.size : 'md';
      args.config = args.config ? args.config : null;
    }
    var self = this;
    var modalInstance = this._modal.open({
      animation : args.animation,
      templateUrl : args.templateUrl,
      controller : 'ModalController as ctrl',
      size : args.size,
      resolve : {
        parentCtrl : function() {
          return self;
        },
        config : args.config
      }
    });

    // TODO: this feature to be updated in the future
    modalInstance.result.then(function() {
    }, function() {
    });
  };

  MainController.prototype.links = function(str, links) {
    if (typeof str === 'undefined' || typeof links === 'undefined') {
      return str;
    }
    var template = '<a href="{url}" target="_blank">{label}</a>';
    for ( var i in links) {
      var link = links[i];
      var a = template.replace('{url}', link.url).replace('{label}', link.name);
      str = str.replace(link.name, a);
    }
    return str;
  };

})();
