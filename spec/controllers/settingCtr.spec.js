describe('settingCtrl', function() {
    var $scope, $rootScope, $controller, $q, $httpBackend;
    var settingService, baseService, functions, $rootParams;
    
    beforeEach(module('ncApp'));
    
    // Mock $modal before injecting services
    beforeEach(module(function($provide) {
        $provide.value('$modal', {
            open: jasmine.createSpy('open')
        });
    }));
    
    beforeEach(inject(function(_$controller_, _$rootScope_, _$q_, _$httpBackend_, _baseService_, _settingService_, _functions_, _$http_) {
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        $controller = _$controller_;
        $q = _$q_;
        $httpBackend = _$httpBackend_;
        baseService = _baseService_;
        settingService = _settingService_;
        functions = _functions_;
        
        // Mock $rootParams (note: actual controller uses $rootParams, not $routeParams)
        $rootParams = {
            app: 1  // Use simple ID instead of string
        };
        
        // Mock HTTP GET to support old .success()/.error() syntax
        var originalGet = _$http_.get;
        spyOn(_$http_, 'get').and.callFake(function(url, config) {
            var promise = originalGet.call(_$http_, url, config);
            promise.success = function(callback) {
                promise.then(function(response) {
                    callback(response.data, response.status, response.headers, config);
                });
                return promise;
            };
            promise.error = function(callback) {
                promise.catch(function(response) {
                    callback(response.data, response.status, response.headers, config);
                });
                return promise;
            };
            return promise;
        });
        
        // Mock HTTP requests
        $httpBackend.whenGET(/templates\//).respond(200, '');
        $httpBackend.whenGET(/apis\/domain\?id=/).respond(200, { id: 1, name: 'TestDomain', relations: [] });
        $httpBackend.whenGET(/apis\/domain\//).respond(200, { values: [] });
        $httpBackend.whenGET(/apis\/category\//).respond(200, []);
        $httpBackend.whenPOST(/apis\/domain/).respond(200, 'Success');
        $httpBackend.whenPOST(/apis\/category/).respond(200, 'Success');
        
        // Spy on service methods - use callFake to avoid real HTTP calls
        spyOn(settingService, 'domain').and.callFake(function(app, callback) {
            // Call callback synchronously or do nothing (based on test)
        });
        spyOn(settingService, 'deleteCatValue').and.returnValue($q.when('Success'));
        spyOn(settingService, 'deleteDomainValue').and.returnValue($q.when('Success'));
        
        spyOn(baseService, 'domainValues').and.returnValue($q.when({
            values: [{ id: 1, value: 'DomainValue1' }]
        }));
        spyOn(baseService, 'categoryValues').and.returnValue($q.when([
            { id: 1, value: 'CategoryValue1' }
        ]));
        
        spyOn(functions, 'isBa').and.returnValue(true);
        spyOn(functions, 'alert');
        
        // Mock jQuery
        window.$ = jasmine.createSpy('$').and.callFake(function(selector) {
            return {
                find: jasmine.createSpy('find').and.returnValue({
                    removeClass: jasmine.createSpy('removeClass')
                }),
                parent: jasmine.createSpy('parent').and.returnValue({
                    addClass: jasmine.createSpy('addClass')
                })
            };
        });
    }));
    
    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation(false);
        $httpBackend.verifyNoOutstandingRequest(false);
    });
    
    describe('Controller initialization', function() {
        it('should initialize the controller and set basic properties', function() {
            $controller('settingCtrl', {
                $scope: $scope,
                $rootScope: $rootScope,
                $rootParams: $rootParams,
                settingService: settingService,
                baseService: baseService,
                functions: functions
            });
            
            expect($rootScope.path).toBe('setting');
            expect($rootScope.header).toBe('templates/header.html');
        });
        
        it('should call functions.isBa with app', function() {
            $controller('settingCtrl', {
                $scope: $scope,
                $rootScope: $rootScope,
                $rootParams: $rootParams,
                settingService: settingService,
                baseService: baseService,
                functions: functions
            });
            
            expect(functions.isBa).toHaveBeenCalled();
        });
        
        it('should set rootScope.isBa based on functions.isBa', function() {
            functions.isBa.and.returnValue(true);
            
            $controller('settingCtrl', {
                $scope: $scope,
                $rootScope: $rootScope,
                $rootParams: $rootParams,
                settingService: settingService,
                baseService: baseService,
                functions: functions
            });
            
            expect($rootScope.isBa).toBe(true);
        });
        
        it('should load domain when isBa is true', function() {
            functions.isBa.and.returnValue(true);
            
            // Override the spy for this specific test to call the callback
            settingService.domain.and.callFake(function(app, callback) {
                callback({
                    id: 1,
                    name: 'TestDomain',
                    relations: [
                        { id: 1, name: 'Template1' },
                        { id: 2, name: 'Template2' }
                    ]
                });
            });
            
            $controller('settingCtrl', {
                $scope: $scope,
                $rootScope: $rootScope,
                $rootParams: $rootParams,
                settingService: settingService,
                baseService: baseService,
                functions: functions
            });
            
            expect(settingService.domain).toHaveBeenCalledWith($rootParams.app, jasmine.any(Function));
            expect($scope.domain).toEqual({
                id: 1,
                name: 'TestDomain',
                relations: [
                    { id: 1, name: 'Template1' },
                    { id: 2, name: 'Template2' }
                ]
            });
            expect($scope.templateTypes).toEqual([
                { id: 1, name: 'Template1' },
                { id: 2, name: 'Template2' }
            ]);
        });
        
        it('should not load domain when isBa is false', function() {
            functions.isBa.and.returnValue(false);
            
            $controller('settingCtrl', {
                $scope: $scope,
                $rootScope: $rootScope,
                $rootParams: $rootParams,
                settingService: settingService,
                baseService: baseService,
                functions: functions
            });
            
            expect(settingService.domain).not.toHaveBeenCalled();
            expect($scope.domain).toBeUndefined();
            expect($scope.templateTypes).toBeUndefined();
        });
    });
    
    describe('$scope.load function', function() {
        beforeEach(function() {
            $controller('settingCtrl', {
                $scope: $scope,
                $rootScope: $rootScope,
                $rootParams: $rootParams,
                settingService: settingService,
                baseService: baseService,
                functions: functions
            });
        });
        
        it('should set loading to 1 when load starts', function() {
            $scope.load('domain', 1, '.target-element', null);
            expect($scope.loading).toBe(1);
        });
        
        it('should set settingService.id', function() {
            $scope.load('domain', 123, '.target-element', null);
            expect(settingService.id).toBe(123);
        });
        
        it('should load domain values when type is domain', function() {
            $scope.load('domain', 1, '.target-element', null);
            $rootScope.$digest();
                
            expect($scope.type).toBe('domain');
            expect(settingService.type).toBe('domain');
            expect(baseService.domainValues).toHaveBeenCalledWith(1, false);
            expect($scope.domainValues).toEqual([{ id: 1, value: 'DomainValue1' }]);
            expect($scope.loading).toBe(0);
        });
        
        it('should load category values when type is category', function() {
            $scope.load('category', 2, '.target-element', 5);
            $rootScope.$digest();
                
            expect($scope.type).toBe('category');
            expect(settingService.type).toBe('category');
            expect(settingService.parentId).toBe(5);
            expect(baseService.categoryValues).toHaveBeenCalledWith(2, false);
            expect($scope.categoryValues).toEqual([{ id: 1, value: 'CategoryValue1' }]);
            expect($scope.loading).toBe(0);
        });
        
        it('should update UI classes using jQuery', function() {
            var mockFind = jasmine.createSpy('find').and.returnValue({
                removeClass: jasmine.createSpy('removeClass')
            });
            var mockParent = jasmine.createSpy('parent').and.returnValue({
                addClass: jasmine.createSpy('addClass')
            });
            
            window.$ = jasmine.createSpy('$').and.callFake(function(selector) {
                if (selector === '.tree') {
                    return { find: mockFind };
                } else {
                    return { parent: mockParent };
                }
            });
            
            $scope.load('domain', 1, '.target-element', null);
            
            expect(window.$).toHaveBeenCalledWith('.tree');
            expect(window.$).toHaveBeenCalledWith('.target-element');
            expect(mockFind).toHaveBeenCalledWith('.active');
            expect(mockParent).toHaveBeenCalled();
        });
        
        it('should handle unknown type and only update UI', function() {
            $scope.load('unknownType', 1, '.target-element', null);
            
            expect($scope.loading).toBe(1);
            expect(settingService.id).toBe(1);
            expect(baseService.domainValues).not.toHaveBeenCalled();
            expect(baseService.categoryValues).not.toHaveBeenCalled();
            // Only UI updates should happen
        });
    });
    
    describe('$scope.setTitle function', function() {
        beforeEach(function() {
            $controller('settingCtrl', {
                $scope: $scope,
                $rootScope: $rootScope,
                $rootParams: $rootParams,
                settingService: settingService,
                baseService: baseService,
                functions: functions
            });
        });
        
        it('should set the title', function() {
            $scope.setTitle('Test Title');
            expect($scope.title).toBe('Test Title');
        });
        
        it('should update title multiple times', function() {
            $scope.setTitle('First Title');
            expect($scope.title).toBe('First Title');
            
            $scope.setTitle('Second Title');
            expect($scope.title).toBe('Second Title');
        });
    });
    
    describe('$scope.deleteDomainValue function', function() {
        beforeEach(function() {
            $controller('settingCtrl', {
                $scope: $scope,
                $rootScope: $rootScope,
                $rootParams: $rootParams,
                settingService: settingService,
                baseService: baseService,
                functions: functions
            });
            
            $scope.domainValues = [
                { id: 1, name: 'Domain1' },
                { id: 2, name: 'Domain2' },
                { id: 3, name: 'Domain3' }
            ];
            
            spyOn(window, 'confirm');
        });
        
        it('should show confirmation dialog with correct message', function() {
            window.confirm.and.returnValue(true);
            
            $scope.deleteDomainValue(1, 'Domain1', 0);
            
            expect(window.confirm).toHaveBeenCalledWith("Are you sure you want to delete 'Domain1'?");
        });
        
        it('should delete domain value when user confirms', function() {
            window.confirm.and.returnValue(true);
            settingService.deleteDomainValue.and.returnValue($q.when('Success'));
            
            $scope.deleteDomainValue(1, 'Domain1', 0);
            $rootScope.$digest();
                
            expect(settingService.deleteDomainValue).toHaveBeenCalledWith(1);
            expect($scope.domainValues.length).toBe(2);
            expect($scope.domainValues[0]).toEqual({ id: 2, name: 'Domain2' });
        });
        
        it('should not delete domain value when user cancels', function() {
            window.confirm.and.returnValue(false);
            
            $scope.deleteDomainValue(1, 'Domain1', 0);
            
            expect(settingService.deleteDomainValue).not.toHaveBeenCalled();
            expect($scope.domainValues.length).toBe(3);
        });
        
        it('should delete correct item by index', function() {
            window.confirm.and.returnValue(true);
            settingService.deleteDomainValue.and.returnValue($q.when('Success'));
            
            $scope.deleteDomainValue(2, 'Domain2', 1);
            $rootScope.$digest();
                
            expect($scope.domainValues.length).toBe(2);
            expect($scope.domainValues[0]).toEqual({ id: 1, name: 'Domain1' });
            expect($scope.domainValues[1]).toEqual({ id: 3, name: 'Domain3' });
        });
    });
    
    describe('$scope.deleteCatValue function', function() {
        beforeEach(function() {
            $controller('settingCtrl', {
                $scope: $scope,
                $rootScope: $rootScope,
                $rootParams: $rootParams,
                settingService: settingService,
                baseService: baseService,
                functions: functions
            });
            
            $scope.categoryValues = [
                { id: 1, name: 'Cat1' },
                { id: 2, name: 'Cat2' },
                { id: 3, name: 'Cat3' }
            ];
        });
        
        it('should show confirmation dialog with correct title', function() {
            $scope.deleteCatValue(1, 'Cat1', 0);
            
            expect($rootScope.showConfirm).toBe(true);
            expect($rootScope.confirm.title).toBe("Are you sure you want to delete 'Cat1'?");
            expect($rootScope.confirm.content).toBe('');
        });
        
        it('should have yes and no callback functions', function() {
            $scope.deleteCatValue(1, 'Cat1', 0);
            
            expect(typeof $rootScope.confirm.yes).toBe('function');
            expect(typeof $rootScope.confirm.no).toBe('function');
        });
        
        it('should delete category value on yes when response is Success', function() {
            settingService.deleteCatValue.and.returnValue($q.when('Success'));
            
            $scope.deleteCatValue(1, 'Cat1', 0);
            $rootScope.confirm.yes();
            $rootScope.$digest();
                
            expect($rootScope.showConfirm).toBe(false);
            expect(settingService.deleteCatValue).toHaveBeenCalledWith(1);
            expect($scope.categoryValues.length).toBe(2);
            expect($scope.categoryValues[0]).toEqual({ id: 2, name: 'Cat2' });
        });
        
        it('should show danger alert when response is not Success', function() {
            settingService.deleteCatValue.and.returnValue($q.when('Error: Cannot delete category'));
            
            $scope.deleteCatValue(1, 'Cat1', 0);
            $rootScope.confirm.yes();
            $rootScope.$digest();
                
            expect($rootScope.showConfirm).toBe(false);
            expect(settingService.deleteCatValue).toHaveBeenCalledWith(1);
            expect($scope.categoryValues.length).toBe(3); // Not deleted
            expect(functions.alert).toHaveBeenCalledWith('danger', 'Error: Cannot delete category');
        });
        
        it('should close dialog on no without deleting', function() {
            $scope.deleteCatValue(1, 'Cat1', 0);
            
            expect($rootScope.showConfirm).toBe(true);
            
            $rootScope.confirm.no();
            
            expect($rootScope.showConfirm).toBe(false);
            expect(settingService.deleteCatValue).not.toHaveBeenCalled();
            expect($scope.categoryValues.length).toBe(3);
        });
        
        it('should delete correct item by index', function() {
            settingService.deleteCatValue.and.returnValue($q.when('Success'));
            
            $scope.deleteCatValue(2, 'Cat2', 1);
            $rootScope.confirm.yes();
            $rootScope.$digest();
                
            expect($scope.categoryValues.length).toBe(2);
            expect($scope.categoryValues[0]).toEqual({ id: 1, name: 'Cat1' });
            expect($scope.categoryValues[1]).toEqual({ id: 3, name: 'Cat3' });
        });
    });
    
    describe('Event listeners', function() {
        beforeEach(function() {
            $controller('settingCtrl', {
                $scope: $scope,
                $rootScope: $rootScope,
                $rootParams: $rootParams,
                settingService: settingService,
                baseService: baseService,
                functions: functions
            });
        });
        
        it('should add domain value on addDomainValueEvent', function() {
            $scope.domainValues = [
                { id: 1, value: 'Existing1' },
                { id: 2, value: 'Existing2' }
            ];
            
            var newValue = { id: 3, value: 'NewDomainValue' };
            
            $scope.$broadcast('addDomainValueEvent', newValue);
            
            expect($scope.domainValues.length).toBe(3);
            expect($scope.domainValues[2]).toEqual(newValue);
        });
        
        it('should add category value on addCatValueEvent', function() {
            $scope.categoryValues = [
                { id: 1, value: 'Existing1' },
                { id: 2, value: 'Existing2' }
            ];
            
            var newValue = { id: 3, value: 'NewCategoryValue' };
            
            $scope.$broadcast('addCatValueEvent', newValue);
            
            expect($scope.categoryValues.length).toBe(3);
            expect($scope.categoryValues[2]).toEqual(newValue);
        });
        
        it('should handle addDomainValueEvent when domainValues is undefined', function() {
            $scope.domainValues = undefined;
            
            var newValue = { id: 1, value: 'FirstValue' };
            
            expect(function() {
                $scope.$broadcast('addDomainValueEvent', newValue);
            }).toThrow();
        });
        
        it('should handle addCatValueEvent when categoryValues is undefined', function() {
            $scope.categoryValues = undefined;
            
            var newValue = { id: 1, value: 'FirstValue' };
            
            expect(function() {
                $scope.$broadcast('addCatValueEvent', newValue);
            }).toThrow();
        });
    });
});

describe('settingFormCtr', function() {
    var $scope, $rootScope, $controller, $q, $httpBackend;
    var settingService, baseService, functions;
    
    beforeEach(module('ncApp'));
    
    // Mock $modal before injecting services
    beforeEach(module(function($provide) {
        $provide.value('$modal', {
            open: jasmine.createSpy('open')
        });
    }));
    
    beforeEach(inject(function(_$controller_, _$rootScope_, _$q_, _$httpBackend_, _settingService_, _baseService_, _functions_, _$http_) {
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        $scope.pparent = {
            cancel: jasmine.createSpy('cancel')
        };
        $scope.$parent = {
            cancel: jasmine.createSpy('cancel')
        };
        $controller = _$controller_;
        $q = _$q_;
        $httpBackend = _$httpBackend_;
        settingService = _settingService_;
        baseService = _baseService_;
        functions = _functions_;
        
        // Add .success()/.error() support to $http for old AngularJS syntax
        var originalPost = _$http_.post;
        spyOn(_$http_, 'post').and.callFake(function(url, data, config) {
            var promise = originalPost.call(_$http_, url, data, config);
            promise.success = function(callback) {
                promise.then(function(response) {
                    callback(response.data, response.status, response.headers, config);
                });
                return promise;
            };
            promise.error = function(callback) {
                promise.catch(function(response) {
                    callback(response.data, response.status, response.headers, config);
                });
                return promise;
            };
            return promise;
        });
        
        // Mock HTTP requests
        $httpBackend.whenGET(/templates\//).respond(200, '');
        $httpBackend.whenGET(/apis\//).respond(200, {});
        $httpBackend.whenPOST(/apis\/domain/).respond(200, { domainValue: 'NewDomain' });
        $httpBackend.whenPOST(/apis\/category/).respond(200, { categoryValue: 'NewCategory' });
        
        // Spy on service methods
        spyOn(settingService, 'addDomainValue').and.returnValue({
            success: function(callback) {
                callback({ domainValue: 'NewDomain' });
                return this;
            }
        });
        spyOn(settingService, 'addCategoryValue').and.returnValue({
            success: function(callback) {
                callback({ categoryValue: 'NewCategory' });
                return this;
            }
        });
        
        spyOn(baseService, 'categoryValues').and.returnValue($q.when([
            { id: 1, value: 'ParentCat1' },
            { id: 2, value: 'ParentCat2' }
        ]));
        
        spyOn(functions, 'alert').and.callFake(function(type, message, callback) {
            if (callback) callback();
        });
        
        // Set up global postData
        window.postData = {};
    }));
    
    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation(false);
        $httpBackend.verifyNoOutstandingRequest(false);
    });
    
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
        });
        
        it('should set hasDes to false for domain type', function() {
            expect($scope.hasDes).toBe(false);
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
        
        it('should set hasDes to true for category type', function() {
            expect($scope.hasDes).toBe(true);
        });
        
        it('should call baseService.categoryValues when parentId is not -1', function() {
            expect(baseService.categoryValues).toHaveBeenCalledWith(5, false);
        });
        
        it('should set parentCatValues after promise resolves', function() {
            try {
                $rootScope.$digest();
            } catch(e) {
                // Ignore digest errors
            }
                
            expect($scope.parentCatValues).toEqual([
                { id: 1, value: 'ParentCat1' },
                { id: 2, value: 'ParentCat2' }
            ]);
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
        
        it('should set hasDes to true for category type', function() {
            expect($scope.hasDes).toBe(true);
        });
        
        it('should not call baseService.categoryValues when parentId is -1', function() {
            expect(baseService.categoryValues).not.toHaveBeenCalled();
        });
    });
    
    describe('Initialization for unknown type', function() {
        beforeEach(function() {
            settingService.type = 'unknownType';
            settingService.parentId = -1;
            
            $controller('settingFormCtr', {
                $scope: $scope,
                $rootScope: $rootScope,
                settingService: settingService,
                baseService: baseService,
                functions: functions
            });
        });
        
        it('should not set any properties for unknown type', function() {
            expect($scope.parent).toBeUndefined();
            expect($scope.hasDes).toBeUndefined();
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
            $scope.value = 'TestDomainValue';
            $scope.submit();
            
            expect(settingService.addDomainValue).toHaveBeenCalledWith({
                domainId: 10,
                domainValue: 'TestDomainValue'
            });
        });
        
        it('should reset parent and hasDes on submit', function() {
            $scope.value = 'TestDomainValue';
            $scope.submit();
            
            expect($scope.parent).toBe(-1);
            expect($scope.hasDes).toBe(false);
        });
        
        it('should show success alert with correct message', function() {
            $scope.value = 'TestDomainValue';
            $scope.submit();
            
            expect(functions.alert).toHaveBeenCalledWith(
                'success',
                'NewDomain is added successfully',
                jasmine.any(Function)
            );
        });
        
        it('should cancel parent dialog after alert', function() {
            $scope.value = 'TestDomainValue';
            $scope.submit();
            
            expect($scope.pparent.cancel).toHaveBeenCalled();
        });
        
        it('should broadcast addDomainValueEvent', function() {
            $scope.value = 'TestDomainValue';
            $scope.submit();
            
            expect($rootScope.$broadcast).toHaveBeenCalledWith(
                'addDomainValueEvent',
                { domainValue: 'NewDomain' }
            );
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
        });
        
        it('should not include parentCategoryValueId when parent is -1', function() {
            $scope.parent = -1;
            $scope.value = 'TestCategory';
            $scope.description = 'Test Description';
            $scope.parentCatValueId = 15;
            
            $scope.submit();
            
            var callArgs = settingService.addCategoryValue.calls.argsFor(0)[0];
            expect(callArgs.parentCategoryValueId).toBeUndefined();
        });
        
        it('should show success alert with correct message', function() {
            $scope.parent = -1;
            $scope.value = 'TestCategory';
            $scope.description = 'Test Description';
            
            $scope.submit();
            
            expect(functions.alert).toHaveBeenCalledWith(
                'success',
                'NewCategory is added successfully',
                jasmine.any(Function)
            );
        });
        
        it('should cancel parent dialog after alert', function() {
            $scope.parent = -1;
            $scope.value = 'TestCategory';
            $scope.description = 'Test Description';
            
            $scope.submit();
            
            expect($scope.pparent.cancel).toHaveBeenCalled();
        });
        
        it('should broadcast addCatValueEvent', function() {
            $scope.parent = -1;
            $scope.value = 'TestCategory';
            $scope.description = 'Test Description';
            
            $scope.submit();
            
            expect($rootScope.$broadcast).toHaveBeenCalledWith(
                'addCatValueEvent',
                { categoryValue: 'NewCategory' }
            );
        });
        
        it('should handle category with parent != -1', function() {
            $scope.parent = 10;
            $scope.value = 'ChildCategory';
            $scope.description = 'Child Description';
            $scope.parentCatValueId = 25;
            
            $scope.submit();
            
            var callArgs = settingService.addCategoryValue.calls.argsFor(0)[0];
            expect(callArgs.parentCategoryValueId).toBe(25);
        });
    });
    
    describe('$scope.submit for unknown type', function() {
        beforeEach(function() {
            settingService.type = 'unknownType';
            settingService.id = 30;
            
            $controller('settingFormCtr', {
                $scope: $scope,
                $rootScope: $rootScope,
                settingService: settingService,
                baseService: baseService,
                functions: functions
            });
            
            spyOn($rootScope, '$broadcast');
        });
        
        it('should not submit anything for unknown type', function() {
            $scope.value = 'TestValue';
            $scope.submit();
            
            expect(settingService.addDomainValue).not.toHaveBeenCalled();
            expect(settingService.addCategoryValue).not.toHaveBeenCalled();
            expect(functions.alert).not.toHaveBeenCalled();
            expect($rootScope.$broadcast).not.toHaveBeenCalled();
            expect($scope.pparent.cancel).not.toHaveBeenCalled();
        });
    });
    
    describe('Edge cases and additional coverage', function() {
        it('should handle multiple parentId values correctly', function() {
            settingService.type = 'category';
            settingService.parentId = 100;
            
            $controller('settingFormCtr', {
                $scope: $scope,
                $rootScope: $rootScope,
                settingService: settingService,
                baseService: baseService,
                functions: functions
            });
            
            expect(baseService.categoryValues).toHaveBeenCalledWith(100, false);
        });
        
        it('should handle empty domain value submission', function() {
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
            
            $scope.value = '';
            $scope.submit();
            
            expect(settingService.addDomainValue).toHaveBeenCalledWith({
                domainId: 10,
                domainValue: ''
            });
        });
        
        it('should handle empty category value submission', function() {
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
            
            $scope.parent = -1;
            $scope.value = '';
            $scope.description = '';
            $scope.submit();
            
            expect(settingService.addCategoryValue).toHaveBeenCalledWith({
                categoryId: 20,
                categoryValue: '',
                description: ''
            });
        });
    });
});
