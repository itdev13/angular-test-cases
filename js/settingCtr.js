ncApp.controller("settingCtrl", ["$scope", "settingService", "$rootScope", "$rootParams", "baseService", "functions",
    function ($scope, settingService, $rootScope, $rootParams, baseService, functions) {
        $rootScope.app = $rootParams.app;
        $rootScope.path = "setting";
        $rootScope.isBa = functions.isBa($rootScope.app);
        $rootScope.header = 'templates/header.html';

        if ($rootScope.isBa) {
            settingService.domainApp($rootScope.app, function (d) {
                $scope.domain = d;
                $scope.templateTypes = d.relations;
            });
        }

        // load domain/category value
        $scope.load = function (type, id, target, parentId) {
            $scope.loading = 1;
            settingService.id = id;
            if (type == "domain") {
                $scope.type = settingService.type = "domain";
                baseService.domainValues(id, false).then(function (d) {
                    $scope.domainValues = d.values;
                    $scope.loading = 0;
                });
            } else if (type == "category") {
                $scope.type = settingService.type = "category";
                settingService.parentId = parentId;
                baseService.categoryValues(id, false).then(function (d) {
                    $scope.categoryValues = d;
                    $scope.loading = 0;
                });
            }
            $(".tree").find(".active").removeClass("active");
            $(target).parent().addClass("active");
        };

        $scope.setTitle = function (title) {
            $scope.title = title;
        };

        $scope.deleteDomainValue = function (id, name, index) {
            var r = confirm("Are you sure you want to delete '" + name + "'?");
            if (r == true) {
                settingService.deleteDomainValue(id).then(function (d) {
                    $scope.domainValues.splice(index, 1);
                });
            }
        };

        $scope.deleteCatValue = function (id, name, index) {
            $rootScope.showConfirm = true;
            $rootScope.confirm = {
                title: "Are you sure you want to delete '" + name + "'?",
                content: "",
                yes: function () {
                    $rootScope.showConfirm = false;
                    settingService.deleteCatValue(id).then(function (d) {
                        if (d == "Success") {
                            $scope.categoryValues.splice(index, 1);
                        } else {
                            functions.alert("danger", d);
                        }
                    });
                },
                no: function () {
                    $rootScope.showConfirm = false;
                }
            };
        }

        $scope.$on('addDomainValueEvent', function (event, data) {
            $scope.domainValues.push(data);
        });

        $scope.$on('addCatValueEvent', function (event, data) {
            $scope.categoryValues.push(data);
        });

}]);

ncApp.controller("settingFormCtr", ["$scope", "settingService", "$rootScope", "baseService", "functions",
    function ($scope, settingService, $rootScope, baseService, functions) {
        postData = {};

        if (settingService.type == "domain") {
            $scope.parent = -1;
            $scope.hasDes = false;
        } else if (settingService.type == "category") {
            if (settingService.parentId != -1) {
                baseService.categoryValues(settingService.parentId, false).then(function (d) {
                    $scope.parentCatValues = d;
                });
            }
            $scope.hasDes = true;
        }

        // add domain/category value
        $scope.submit = function () {
            if (settingService.type == "domain") {
                postData.domainId = settingService.id;
                postData.domainValue = $scope.value;
                $scope.parent = -1;
                $scope.hasDes = false;
                var response = settingService.addDomainValue(postData);
                response.success(function (response) {
                    functions.alert("success", response.domainValue + " is added successfully", function () {
                        $scope.pparent.cancel();
                    });
                    $rootScope.$broadcast('addDomainValueEvent', response);
                });
            } else if (settingService.type == "category") {
                postData.categoryId = settingService.id;
                postData.categoryValue = $scope.value;
                postData.description = $scope.description;
                if ($scope.parent != -1) {
                    postData.parentCategoryValueId = $scope.parentCatValueId;
                }
                var response = settingService.addCategoryValue(postData);
                response.success(function (response) {
                    functions.alert("success", response.categoryValue + " is added successfully", function () {
                        $scope.pparent.cancel();
                    });
                    $rootScope.$broadcast('addCatValueEvent', response);
                });
            }
        };

    }]);

