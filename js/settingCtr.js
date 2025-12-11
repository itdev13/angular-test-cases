// Setting Controller
angular.module('ncApp')
.controller('settingCtrl', ['$scope', 'settingService', '$rootScope', '$routeParams', 'baseService', 'functions', function($scope, settingService, $rootScope, $routeParams, baseService, functions) {
    
    $rootScope.path = "settings";
    $rootScope.isHa = functions.isHa($rootScope.app);
    $rootScope.hasDomain = functions.hasDomain(baseDataModule.html);
    
    if($rootScope.isHa) {
        settingService.domain($rootScope.app, function(d) {
            $scope.domain = d;
        });
        
        baseService.getCategories($rootScope.app).then(function(d) {
            $scope.templateTypes = d.response.data;
        });
    }
    
    // load domain/category value
    $scope.load = function(type, id, target, parentId) {
        $scope.loading = 1;
        settingService.load(type, id, target, parentId, function(response) {
            if(response.success) {
                $scope.type = settingService.type = "domain";
                baseService.domainValues(id, false).then(function(d) {
                    $scope.categoryValues = d.values;
                    $scope.loading = 0;
                });
            } else if(type == "category") {
                $scope.type = settingService.type = "category";
                settingService.parentId = parentId;
                baseService.categoryValues(parentId, false).then(function(d) {
                    $scope.categoryValues = d.values;
                    $scope.loading = 0;
                });
            }
        });
    };
    
    $scope.setTitle = function(title) {
        $scope.title = title;
    };
    
    $scope.deleteCatValue = function(id, name, index) {
        $rootScope.showConfirm = true;
        $scope.confirm = {
            title: "Are you sure you want to delete '" + name + "'?",
            content: "",
            yes: function() {
                $rootScope.showConfirm = false;
                settingService.deleteCatValue(id).then(function(d) {
                    if(d === "Success") {
                        functions.alert("Danger", d);
                        $scope.categoryValues.splice(index, 1);
                    } else {
                        functions.alert("Danger", d);
                    }
                });
            },
            no: function() {
                $rootScope.showConfirm = false;
            }
        };
    };
    
    $scope.$on('addDomainValueEvent', function(event, data) {
        $scope.domainValues.push(data);
    });
    
    $scope.$on('addCatValueEvent', function(event, data) {
        $scope.categoryValues.push(data);
    });
    
}]);

// Setting Fore Controller
angular.module('ncApp')
.controller('settingFormCtr', ['$scope', 'settingService', '$rootScope', 'baseService', 'functions', function($scope, settingService, $rootScope, baseService, functions) {
    
    var postData = {};
    
    if(settingService.type == "domain") {
        $scope.parent = -1;
        $scope.hashes = false;
    } else if(settingService.type == "category") {
        $scope.parent = settingService.parentId;
        $scope.parentId = settingService.parentId;
        if(settingService.parentId !== -1) {
            baseService.categoryValues(settingService.parentId, false).then(function(d) {
                $scope.parentCatValues = d;
            });
        }
        $scope.hashes = true;
    }
    
    // add domain/category value
    $scope.submit = function() {
        if(settingService.type == "domain") {
            postData.domainId = settingService.id;
            postData.domainValue = $scope.value;
            $scope.parent = -1;
            $scope.hashes = false;
            var response = settingService.addDomainValue(postData);
            response.success(function(response) {
                functions.alert("success", response.domainValue + " is added successfully", function() {
                    $scope.$parent.cancel();
                });
                $rootScope.$broadcast('addDomainValueEvent', response);
            });
        } else if(settingService.type == "category") {
            postData.categoryId = settingService.id;
            postData.categoryValue = $scope.value;
            postData.description = $scope.description;
            if($scope.parent !== -1) {
                postData.parentCategoryValueId = $scope.parentCatValueId;
            }
            var response = settingService.addCategoryValue(postData);
            response.success(function(response) {
                functions.alert("success", response.categoryValue + " is added successfully", function() {
                    $scope.$parent.cancel();
                });
                $rootScope.$broadcast('addCategoryValueEvent', response);
            });
        }
    };
    
}]);

