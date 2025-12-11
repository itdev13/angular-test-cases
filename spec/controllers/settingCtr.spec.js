describe('settingCtrl', function() {
  var $scope, $rootScope, $controller, $q;
  var settingService, baseService, functions, $routeParams;
  
  beforeEach(module('ncApp'));
  
  beforeEach(inject(function(_$controller_, _$rootScope_, _$q_) {
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $controller = _$controller_;
    $q = _$q_;
    
    // Mock $routeParams
    $routeParams = {};
    
    // Mock settingService
    settingService = {
      type: '',
      id: null,
      parentId: null,
      domain: jasmine.createSpy('domain'),
      load: jasmine.createSpy('load'),
      deleteCatValue: jasmine.createSpy('deleteCatValue').and.returnValue($q.when('Success'))
    };
    
    // Mock baseService
    baseService = {
      getCategories: jasmine.createSpy('getCategories').and.returnValue($q.when({
        response: { data: [{ id: 1, name: 'Template1' }] }
      })),
      domainValues: jasmine.createSpy('domainValues').and.returnValue($q.when({
        values: [{ id: 1, value: 'Value1' }]
      })),
      categoryValues: jasmine.createSpy('categoryValues').and.returnValue($q.when({
        values: [{ id: 1, value: 'Category1' }]
      }))
    };
    
    // Mock functions service
    functions = {
      isHa: jasmine.createSpy('isHa').and.returnValue(true),
      hasDomain: jasmine.createSpy('hasDomain').and.returnValue(true),
      alert: jasmine.createSpy('alert')
    };
    
    // Mock baseDataModule
    window.baseDataModule = { html: 'test' };
  }));
  
  afterEach(function() {
    delete window.baseDataModule;
  });
  
  describe('Controller initialization', function() {
    it('should initialize the controller and set path to settings', function() {
      $controller('settingCtrl', {
        $scope: $scope,
        $rootScope: $rootScope,
        $routeParams: $routeParams,
        settingService: settingService,
        baseService: baseService,
        functions: functions
      });
      
      expect($scope).toBeDefined();
      expect($rootScope.path).toBe('settings');
    });
    
    it('should call functions.isHa with app', function() {
      $rootScope.app = 'testApp';
      
      $controller('settingCtrl', {
        $scope: $scope,
        $rootScope: $rootScope,
        $routeParams: $routeParams,
        settingService: settingService,
        baseService: baseService,
        functions: functions
      });
      
      expect(functions.isHa).toHaveBeenCalledWith('testApp');
    });
    
    it('should call functions.hasDomain with baseDataModule.html', function() {
      $controller('settingCtrl', {
        $scope: $scope,
        $rootScope: $rootScope,
        $routeParams: $routeParams,
        settingService: settingService,
        baseService: baseService,
        functions: functions
      });
      
      expect(functions.hasDomain).toHaveBeenCalledWith('test');
      expect($rootScope.hasDomain).toBe(true);
    });
    
    it('should load domain and categories when isHa is true', function(done) {
      $rootScope.app = 'testApp';
      functions.isHa.and.returnValue(true);
      
      settingService.domain.and.callFake(function(app, callback) {
        callback({ id: 1, name: 'TestDomain' });
      });
      
      $controller('settingCtrl', {
        $scope: $scope,
        $rootScope: $rootScope,
        $routeParams: $routeParams,
        settingService: settingService,
        baseService: baseService,
        functions: functions
      });
      
      expect(settingService.domain).toHaveBeenCalledWith('testApp', jasmine.any(Function));
      expect($scope.domain).toEqual({ id: 1, name: 'TestDomain' });
      expect(baseService.getCategories).toHaveBeenCalledWith('testApp');
      
      // Wait for promise resolution
      setTimeout(function() {
        try {
          $rootScope.$apply();
        } catch(e) {}
        expect($scope.templateTypes).toEqual([{ id: 1, name: 'Template1' }]);
        done();
      }, 0);
    });
    
    it('should not load domain and categories when isHa is false', function() {
      functions.isHa.and.returnValue(false);
      
      $controller('settingCtrl', {
        $scope: $scope,
        $rootScope: $rootScope,
        $routeParams: $routeParams,
        settingService: settingService,
        baseService: baseService,
        functions: functions
      });
      
      expect(settingService.domain).not.toHaveBeenCalled();
      expect(baseService.getCategories).not.toHaveBeenCalled();
    });
  });
  
  describe('$scope.load', function() {
    beforeEach(function() {
      $controller('settingCtrl', {
        $scope: $scope,
        $rootScope: $rootScope,
        $routeParams: $routeParams,
        settingService: settingService,
        baseService: baseService,
        functions: functions
      });
    });
    
    it('should set loading to 1 when load starts', function() {
      settingService.load.and.callFake(function() {});
      $scope.load('domain', 1, 'target', null);
      expect($scope.loading).toBe(1);
    });
    
    it('should load domain values when response.success is true', function(done) {
      settingService.load.and.callFake(function(type, id, target, parentId, callback) {
        callback({ success: true });
      });
      
      $scope.load('domain', 1, 'target', null);
      
      setTimeout(function() {
        try {
          $rootScope.$apply();
        } catch(e) {}
        
        expect($scope.type).toBe('domain');
        expect(settingService.type).toBe('domain');
        expect(baseService.domainValues).toHaveBeenCalledWith(1, false);
        expect($scope.categoryValues).toEqual([{ id: 1, value: 'Value1' }]);
        expect($scope.loading).toBe(0);
        done();
      }, 0);
    });
    
    it('should load category values when type is category and response.success is false', function(done) {
      settingService.load.and.callFake(function(type, id, target, parentId, callback) {
        callback({ success: false });
      });
      
      $scope.load('category', 2, 'target', 3);
      
      setTimeout(function() {
        try {
          $rootScope.$apply();
        } catch(e) {}
        
        expect($scope.type).toBe('category');
        expect(settingService.type).toBe('category');
        expect(settingService.parentId).toBe(3);
        expect(baseService.categoryValues).toHaveBeenCalledWith(3, false);
        expect($scope.categoryValues).toEqual([{ id: 1, value: 'Category1' }]);
        expect($scope.loading).toBe(0);
        done();
      }, 0);
    });
  });
  
  describe('$scope.setTitle', function() {
    beforeEach(function() {
      $controller('settingCtrl', {
        $scope: $scope,
        $rootScope: $rootScope,
        $routeParams: $routeParams,
        settingService: settingService,
        baseService: baseService,
        functions: functions
      });
    });
    
    it('should set the title', function() {
      $scope.setTitle('Test Title');
      expect($scope.title).toBe('Test Title');
    });
  });
  
  describe('$scope.deleteCatValue', function() {
    beforeEach(function() {
      $controller('settingCtrl', {
        $scope: $scope,
        $rootScope: $rootScope,
        $routeParams: $routeParams,
        settingService: settingService,
        baseService: baseService,
        functions: functions
      });
      
      $scope.categoryValues = [
        { id: 1, name: 'Cat1' },
        { id: 2, name: 'Cat2' }
      ];
    });
    
    it('should show confirmation dialog with correct title', function() {
      $scope.deleteCatValue(1, 'Cat1', 0);
      
      expect($rootScope.showConfirm).toBe(true);
      expect($scope.confirm.title).toBe("Are you sure you want to delete 'Cat1'?");
      expect($scope.confirm.content).toBe('');
    });
    
    it('should delete category value on confirmation when response is Success', function(done) {
      settingService.deleteCatValue.and.returnValue($q.when('Success'));
      
      $scope.deleteCatValue(1, 'Cat1', 0);
      $scope.confirm.yes();
      
      setTimeout(function() {
        try {
          $rootScope.$apply();
        } catch(e) {}
        
        expect($rootScope.showConfirm).toBe(false);
        expect(settingService.deleteCatValue).toHaveBeenCalledWith(1);
        expect($scope.categoryValues.length).toBe(1);
        expect(functions.alert).toHaveBeenCalledWith('Danger', 'Success');
        done();
      }, 0);
    });
    
    it('should show alert but not delete when response is not Success', function(done) {
      settingService.deleteCatValue.and.returnValue($q.when('Error occurred'));
      
      $scope.deleteCatValue(1, 'Cat1', 0);
      $scope.confirm.yes();
      
      setTimeout(function() {
        try {
          $rootScope.$apply();
        } catch(e) {}
        
        expect($rootScope.showConfirm).toBe(false);
        expect(settingService.deleteCatValue).toHaveBeenCalledWith(1);
        expect($scope.categoryValues.length).toBe(2); // Not deleted
        expect(functions.alert).toHaveBeenCalledWith('Danger', 'Error occurred');
        done();
      }, 0);
    });
    
    it('should close dialog on cancel without deleting', function() {
      $scope.deleteCatValue(1, 'Cat1', 0);
      $scope.confirm.no();
      
      expect($rootScope.showConfirm).toBe(false);
      expect($scope.categoryValues.length).toBe(2);
    });
  });
  
  describe('Event listeners', function() {
    beforeEach(function() {
      $controller('settingCtrl', {
        $scope: $scope,
        $rootScope: $rootScope,
        $routeParams: $routeParams,
        settingService: settingService,
        baseService: baseService,
        functions: functions
      });
    });
    
    it('should add domain value on addDomainValueEvent', function() {
      $scope.domainValues = [{ id: 1, value: 'Existing' }];
      var newValue = { id: 3, value: 'NewValue' };
      
      $scope.$broadcast('addDomainValueEvent', newValue);
      
      expect($scope.domainValues.length).toBe(2);
      expect($scope.domainValues[1]).toEqual(newValue);
    });
    
    it('should add category value on addCatValueEvent', function() {
      $scope.categoryValues = [{ id: 1, value: 'Existing' }];
      var newValue = { id: 3, value: 'NewCategory' };
      
      $scope.$broadcast('addCatValueEvent', newValue);
      
      expect($scope.categoryValues.length).toBe(2);
      expect($scope.categoryValues[1]).toEqual(newValue);
    });
  });
});

describe('settingFormCtr', function() {
  var $scope, $rootScope, $controller, $q;
  var settingService, baseService, functions;
  
  beforeEach(module('ncApp'));
  
  beforeEach(inject(function(_$controller_, _$rootScope_, _$q_) {
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $scope.$parent = {
      cancel: jasmine.createSpy('cancel')
    };
    $controller = _$controller_;
    $q = _$q_;
    
    // Mock settingService
    settingService = {
      type: 'domain',
      id: 1,
      parentId: -1,
      addDomainValue: jasmine.createSpy('addDomainValue').and.returnValue({
        success: function(callback) {
          callback({ domainValue: 'NewDomain' });
        }
      }),
      addCategoryValue: jasmine.createSpy('addCategoryValue').and.returnValue({
        success: function(callback) {
          callback({ categoryValue: 'NewCategory' });
        }
      })
    };
    
    // Mock baseService
    baseService = {
      categoryValues: jasmine.createSpy('categoryValues').and.returnValue($q.when({
        values: [{ id: 1, value: 'ParentCat' }]
      }))
    };
    
    // Mock functions service
    functions = {
      alert: jasmine.createSpy('alert').and.callFake(function(type, message, callback) {
        if (callback) callback();
      })
    };
  }));
  
  describe('Initialization for domain type', function() {
    beforeEach(function() {
      settingService.type = 'domain';
      settingService.parentId = -1;
      
      $controller('settingFormCtr', {
        $scope: $scope,
        $rootScope: $rootScope,
        settingService: settingService,
        baseService: baseService,
        functions: functions
      });
    });
    
    it('should set parent to -1 for domain type', function() {
      expect($scope.parent).toBe(-1);
      expect($scope.hashes).toBe(false);
    });
    
    it('should not call baseService.categoryValues for domain type', function() {
      expect(baseService.categoryValues).not.toHaveBeenCalled();
    });
  });
  
  describe('Initialization for category type with parent', function() {
    beforeEach(function() {
      settingService.type = 'category';
      settingService.parentId = 5;
      
      $controller('settingFormCtr', {
        $scope: $scope,
        $rootScope: $rootScope,
        settingService: settingService,
        baseService: baseService,
        functions: functions
      });
    });
    
    it('should set parent and hashes for category type', function() {
      expect($scope.parent).toBe(5);
      expect($scope.parentId).toBe(5);
      expect($scope.hashes).toBe(true);
    });
    
    it('should call baseService.categoryValues when parentId is not -1', function(done) {
      expect(baseService.categoryValues).toHaveBeenCalledWith(5, false);
      
      setTimeout(function() {
        try {
          $rootScope.$apply();
        } catch(e) {}
        expect($scope.parentCatValues).toEqual({ values: [{ id: 1, value: 'ParentCat' }] });
        done();
      }, 0);
    });
  });
  
  describe('Initialization for category type without parent', function() {
    beforeEach(function() {
      settingService.type = 'category';
      settingService.parentId = -1;
      
      $controller('settingFormCtr', {
        $scope: $scope,
        $rootScope: $rootScope,
        settingService: settingService,
        baseService: baseService,
        functions: functions
      });
    });
    
    it('should set parent to -1 for category with no parent', function() {
      expect($scope.parent).toBe(-1);
      expect($scope.parentId).toBe(-1);
      expect($scope.hashes).toBe(true);
    });
    
    it('should not call baseService.categoryValues when parentId is -1', function() {
      expect(baseService.categoryValues).not.toHaveBeenCalled();
    });
  });
  
  describe('$scope.submit for domain', function() {
    beforeEach(function() {
      settingService.type = 'domain';
      settingService.id = 10;
      
      $controller('settingFormCtr', {
        $scope: $scope,
        $rootScope: $rootScope,
        settingService: settingService,
        baseService: baseService,
        functions: functions
      });
      
      spyOn($rootScope, '$broadcast');
    });
    
    it('should add domain value successfully', function() {
      $scope.value = 'TestDomain';
      $scope.submit();
      
      expect(settingService.addDomainValue).toHaveBeenCalledWith({
        domainId: 10,
        domainValue: 'TestDomain'
      });
      expect($scope.parent).toBe(-1);
      expect($scope.hashes).toBe(false);
      expect(functions.alert).toHaveBeenCalledWith('success', 'NewDomain is added successfully', jasmine.any(Function));
      expect($rootScope.$broadcast).toHaveBeenCalledWith('addDomainValueEvent', { domainValue: 'NewDomain' });
      expect($scope.$parent.cancel).toHaveBeenCalled();
    });
  });
  
  describe('$scope.submit for category', function() {
    beforeEach(function() {
      settingService.type = 'category';
      settingService.id = 20;
      
      $controller('settingFormCtr', {
        $scope: $scope,
        $rootScope: $rootScope,
        settingService: settingService,
        baseService: baseService,
        functions: functions
      });
      
      spyOn($rootScope, '$broadcast');
    });
    
    it('should add category value without parent', function() {
      $scope.parent = -1;
      $scope.value = 'TestCategory';
      $scope.description = 'Test Description';
      
      $scope.submit();
      
      expect(settingService.addCategoryValue).toHaveBeenCalledWith({
        categoryId: 20,
        categoryValue: 'TestCategory',
        description: 'Test Description'
      });
      expect(functions.alert).toHaveBeenCalledWith('success', 'NewCategory is added successfully', jasmine.any(Function));
      expect($rootScope.$broadcast).toHaveBeenCalledWith('addCategoryValueEvent', { categoryValue: 'NewCategory' });
      expect($scope.$parent.cancel).toHaveBeenCalled();
    });
    
    it('should add category value with parent', function() {
      $scope.parent = 5;
      $scope.value = 'TestCategory';
      $scope.description = 'Test Description';
      $scope.parentCatValueId = 15;
      
      $scope.submit();
      
      expect(settingService.addCategoryValue).toHaveBeenCalledWith({
        categoryId: 20,
        categoryValue: 'TestCategory',
        description: 'Test Description',
        parentCategoryValueId: 15
      });
      expect(functions.alert).toHaveBeenCalledWith('success', 'NewCategory is added successfully', jasmine.any(Function));
      expect($rootScope.$broadcast).toHaveBeenCalledWith('addCategoryValueEvent', { categoryValue: 'NewCategory' });
      expect($scope.$parent.cancel).toHaveBeenCalled();
    });
  });
});
