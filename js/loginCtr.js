ncApp.controller("loginCtrl", [
  "$scope",
  "$rootScope",
  "$location",
  "userService",
  "functions",
  function ($scope, $rootScope, $location, userService, functions) {
    $scope.data = {};
    userService.logout();
    $rootScope.header = "templates/headerLogin.html";
    $scope.disableChangeUser = false;
    /**
     * storage Application validation in case of undefined
     * Future need to replaced with interface(CheckAppID)
     **/
    // $scope.varifyStorateApp = function() {
    //     var appListResponse = userService.checkAppId();
    //     appListResponse.success(function(response){
    //         console.log('app list ->', response)
    //     })
    // }
    var appList = [
      "160829", //SMC
      "161380", //PMC
      "156030", //Secure
      "160842", //AMC
      "167433", //OMC
      "162653", //EMC
      "162742", //XMC
      "164555", //DMC
      "170302", //KMC
      "34393", //HMC
      "171005", //LMC
      "153904", //ISG Cloud
      "37948", //S&P OPS
      "170295", //KYC
      "172910", //DH
      "167969", //Olympus
      "160720", //ISG NC
    ];
    var storageApp = "";
    if (appList.indexOf("storageApp") > -1) {
      storageApp = localStorage.getItem("app");
    } else {
      storageApp = "160829";
    }

    $scope.login = function () {
      if (!$scope.data.userId || !$scope.data.password) {
        $scope.loginError = true;
        return;
      }

      $scope.data.appName = $rootScope.appName ? $rootScope.appName : "160829";
      if (storageApp) {
        $scope.data.appName = storageApp;
      }
      var responce = userService.login($scope.data);
      responce.success(function (responce) {
        if (responce != "") {
          $rootScope.header = "templates/header.html";
          $rootScope.user = $scope.data.userId;
          $rootScope.userName = responce.fullName;

          localStorage.setItem("isBa", JSON.stringify(responce.roles));
          localStorage.setItem("user", $scope.data.userId);
          localStorage.setItem("userName", responce.fullName);

          $rootScope.isAdmin = functions.isAdmin($rootScope.app);
          $location.path("/notification/" + $scope.data.appName);
        } else {
          $scope.loginError = true;
        }
      });
      responce.error(function (data, status, headers, config, statusText) {
        $scope.loginError = true;
      });
    };

    var is_chrome = navigator.userAgent.toLowerCase().indexOf("chrome") > -1;
    var isIE11 = !!navigator.userAgent.match(/Trident.*rv[ :]*11\./);
    if (is_chrome || isIE11) {
      $("#is_chrome").addClass("hidden");
      $("##login").removeClass("hidden");
    }
  },
]);

ncApp.controller("loginPopupCtrl", [
  "$scope",
  "$rootScope",
  "$location",
  "userService",
  "functions",
  function ($scope, $rootScope, $location, userService, functions) {
    $scope.data = {
      userId: $rootScope.user,
    };

    $scope.disableChangeUser = true;
    $scope.login = function () {
      if (!$scope.data.userId || !$scope.data.password) {
        $scope.loginError = true;
        return;
      }
      var responce = userService.login($scope.data);
      responce.success(function (responce) {
        if (responce != "") {
          $rootScope.user = $scope.data.userId;
          $rootScope.userName = responce.fullName;

          localStorage.setItem("isBa", JSON.stringify(responce.roles));
          localStorage.setItem("user", $scope.data.userId);
          localStorage.setItem("userName", responce.fullName);

          $rootScope.isAdmin = functions.isAdmin($rootScope.app);
          $scope.$parent.cancel();
          functions.alert("success", "login successfully");
        } else {
          $scope.loginError = true;
        }
      });
      responce.error(function (data, status, headers, config, statusText) {
        $scope.loginError = true;
      });
    };
  },
]);

ncApp.controller("userProfile", [
  "$scope",
  "$rootScope",
  "userService",
  "functions",
  function ($scope, $rootScope, userService, functions) {
    userService.userProfile($rootScope.user).then(function (d) {
      $scope.data = d;
    });

    $scope.allowedDomains = [
      "citi.com",
      "ssmb.com",
      "imeen.snsmb.com",
      "iio.citi.com",
      "imeu.snsmb.com",
    ];

    $scope.emailPattern = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})$/;

    $scope.isEmailValid = function (email) {
      if (!email || !$scope.emailPattern.test(email)) {
        return false;
      }
      var domain = email.split("@")[1];
      return $scope.allowedDomains.includes(domain);
    };

    $scope.submit = function (data) {
      if (!$scope.isEmailValid(data.email)) {
        functions.alert("error", "Invalid Email address", function () {});
        return;
      }
      data = {
        userId: $rootScope.user,
        business: data.business,
        manager: {
          userId: data.manager.userId,
        },
        phone: data.phone,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
      };
      userService.updateProfile(data).then(function (d) {
        functions.alert("success", "Save successfully", function () {
          $scope.$parent.cancel();
        });
        localStorage.setItem("userName", d.fullName);
        $rootScope.userName = d.fullName;
      });
    };
  },
]);

ncApp.controller("searchCtrl", [
  "$scope",
  "$rootScope",
  "ncFormData",
  "baseService",
  "functions",
  function ($scope, $rootScope, ncFormData, baseService, functions) {
    $scope.datePickerE = function () {
      $(".datepickers").datepicker();
    };

    $scope.search = {
      textFields: {},
      categories: {},
      domains: {},
    };
    $scope.category = {}; // category data source
    $scope.categories = {}; // search category value
    $scope.domain = {}; // domain data source
    $scope.domains = {}; // search domain value
    $scope.parent = [];
    var fields;

    // select template -- get template type and template by app ID
    baseService.getTemplates(
      $rootScope.app,
      function (templateTypes, status) {
        $scope.templates = [];
        console.log("test1");
        angular.forEach(templateTypes, function (templateType) {
          console.log("test2");
          $scope.templates = $scope.templates.concat(templateType.templates);
        });

        // hardcode delete template 1
        angular.forEach($scope.templates, function (item, k) {
          if (item.templateId == 1) {
            $scope.templates.splice(k, 1);
          }
        });

        if ($scope.templates.length == 1) {
          $scope.getFields($scope.templates[0].templateId);
          getAllCategoryValues($scope.templates[0].templateTypeId);
        }
      }
    );

    function getAllCategoryValues(templateTypeId) {
      // get all the category value
      baseService
        .categoryValuesByTemplate(templateTypeId, $rootScope.app)
        .then(function (d) {
          var category = {};
          angular.forEach(d, function (item) {
            category[item.categoryId] = item;
            category[item.categoryId].all = item.specialCategoryValue;
          });
          $scope.category = category;
        }); // end
    }

    var toBeSelect = [
      {
        fieldId: "reviewer",
        displayName: "Reviewer",
        displayType: "TEXT",
      },
      {
        fieldId: "reviewTime",
        displayName: "Review Time",
        displayType: "dateRange",
      },
      {
        fieldId: "lastUpdatedBy",
        displayName: "Last Updated By",
        displayType: "TEXT",
      },
      {
        fieldId: "lastUpdatedTime",
        displayName: "Last Updated Time",
        displayType: "dateRange",
      },
    ];
    $scope.toBeSelect = angular.copy(toBeSelect);
    $scope.getFields = function (templateId) {
      $scope.toBeSelect = angular.copy(toBeSelect);
      $scope.searchFields = angular.copy(searchFields);

      var templateTypeId = $scope.templates.getValueByKey(
        "templateId",
        templateId,
        "templateTypeId"
      );

      getAllCategoryValues(templateTypeId);

      ncFormData.getField(templateId, $rootScope.app).success(function (d) {
        angular.forEach(d, function (item) {
          if (item.displayType == "TEXT") {
            $scope.toBeSelect.push(item);
          } else if (item.displayType == "TEXT AREA") {
            item.displayType = "TEXT";
            $scope.toBeSelect.push(item);
          } else if (item.valueType == "CATEGORY" && item.displayType != null) {
            $scope.toBeSelect.push(item);
          } else if (
            item.displayType == "MULTI_SELECT_SEARCH" &&
            item.valueType == "DOMAIN"
          ) {
            $scope.toBeSelect.push(item);
            baseService
              .domainValues(item.domainId)
              .then(function (domainValue) {
                $scope.domain[item.domainId] = domainValue.values;
              });
          }
        });
        $scope.selected = $scope.toBeSelect[0].fieldId;
        fields = d;
      });
    };

    var searchFields = [
      {
        fieldId: "effective",
        displayName: "Effective Date/Time",
        displayType: "dateRange",
      },
      {
        fieldId: "emailSubject",
        displayName: "Email Subject",
        displayType: "TEXT",
      },
      {
        fieldId: "createdBy",
        displayName: "Creator",
        displayType: "TEXT",
      },
      {
        fieldId: "createTime",
        displayName: "Create Time",
        displayType: "dateRange",
      },
    ];
    $scope.searchFields = angular.copy(searchFields);

    var dateRageFields = []; // [lastUpdatedTime, lastUpdatedBy...]

    angular.forEach($scope.searchFields, function (field) {
      if (field.displayType == "dateRange") {
        $scope.search[field.fieldId] = {};
        dateRageFields.push(field.fieldId);
      }
    });

    $scope.addCondition = function () {
      var selectedKey = $scope.selected;
      var index = $scope.toBeSelect.includeObjectBy("fieldId", selectedKey);
      var selectedField = $scope.toBeSelect[index];
      $scope.searchFields.push(selectedField);
      $scope.toBeSelect.splice(index, 1);
      if ($scope.toBeSelect.length > 0) {
        $scope.selected = $scope.toBeSelect[0].fieldId;
      }

      if (selectedField.displayType == "dateRange") {
        $scope.search[selectedField.fieldId] = {};
        dateRageFields.push(selectedField.fieldId);
      }
    };

    $scope.deleteCondition = function (key) {
      var index = $scope.searchFields.includeObjectBy("fieldId", key);
      var deleteField = $scope.searchFields[index];
      $scope.toBeSelect.push(deleteField);
      $scope.searchFields.splice(index, 1);
      delete $scope.search[key];
    };

    $scope.searchById = function () {
      var query = {
        appId: $rootScope.app,
        displayId: $scope.notificationId,
      };
      $rootScope.$broadcast("filterBySearch", query);
      $scope.$parent.cancel();
    };

    $scope.advancedSearch = function () {
      // $scope.search.textFields = $scope.textFields;
      $scope.search.appId = $rootScope.app;

      angular.forEach($scope.search.textFields, function (v, k) {
        if (isNaN(k)) {
          $scope.search[k] = v;
          delete $scope.search.textFields[k];
        }
      });

      angular.forEach($scope.categories, function (v, k) {
        $scope.search.categories[k] = [];
        angular.forEach(v, function (item) {
          $scope.search.categories[k].push(item.categoryValueId);
        });
        if ($scope.search.categories[k].length == 0)
          delete $scope.search.categories[k];
      });

      var domainSummery = ""; // xx=[xyz, yzx];
      angular.forEach($scope.domains, function (v, k) {
        $scope.search.domains[k] = [];
        var values = [];
        angular.forEach(v, function (item) {
          $scope.search.domains[k].push(item.domainValueId);
          values.push(item.domainValue);
        });
        if (values.length == 0) {
          delete $scope.search.domains[k];
        } else {
          var domainName = functions.getValueById(
            fields,
            "domainId",
            "displayName",
            k
          );
          domainSummery = domainSummery + domainName + " = [" + values + "]; ";
        }
      });

      angular.forEach($scope.search, function (v, k) {
        if (k == "createdBy" || k == "lastUpdatedBy" || k == "reviewer") {
          $scope.search[k] = v.toLowerCase();
        }

        if (dateRageFields.indexOf(k) > -1) {
          if (!v.start && !v.end) {
            delete $scope.search[k];
          } else {
            if (!v.start) {
              v.start = "2000/01/01";
            }
            if (!v.end) {
              v.end = "2099/01/01";
            }
            v.start = v.start.replace(/-/g, "/");
            v.end = v.end.replace(/-/g, "/");
            v.start = new Date(v.start).dateWithTimeZone();
            v.end = new Date(v.end).dateWithTimeZone();
          }
        }

        if (angular.equals({}, v)) {
          delete $scope.search[k];
        }
      });

      let category = [];
      angular.forEach($scope.category, function (v, k) {
        category.push(v);
      });

      $rootScope.$broadcast(
        "filterBySearch",
        $scope.search,
        fields,
        domainSummery,
        category
      );
      $scope.$parent.cancel();
    };
  },
]);

ncApp.controller("adminCtrl", [
  "$scope",
  "$rootScope",
  "$routeParams",
  "ncList",
  "adminService",
  "functions",
  "userService",
  function (
    $scope,
    $rootScope,
    $routeParams,
    ncList,
    adminService,
    functions,
    userService
  ) {
    $rootScope.app = $routeParams.app;
    $rootScope.isAdmin = functions.isAdmin($rootScope.app);
    $rootScope.isBa = functions.isBa($rootScope.app);
    $rootScope.path = "admin";

    $rootScope.header = "templates/header.html";
    $scope.admin = false;

    $scope.setRole = function () {
      var userProfile = {
        userId: $scope.data.userId,
        business: $scope.data.business,
        manager: {
          userId: $scope.data.manager.userId,
        },
        phone: $scope.data.phone,
        email: $scope.data.email,
        firstName: $scope.data.firstName,
        lastName: $scope.data.lastName,
      };
      userService.updateProfile(userProfile);

      var data = {
        userId: $scope.data.userId,
        role: $scope.role,
        appId: $rootScope.app,
        admin: $scope.admin,
      };

      adminService
        .setRole(data)
        .success(function (d) {
          getUserList();
          functions.alert("success", "Save successfully");
        })
        .error(function (d) {
          functions.alert("danger", "Error! Please retry");
        });
    };

    var getUserList = function () {
      adminService.getUserList().success(function (d) {
        angular.forEach(d, function (user) {
          // yz21761 - Yune Zhang
          if (user.FIRST_NAME == null && user.LAST_NAME == null) {
            user.name = user.USER_ID;
          } else {
            user.name = user.USER_ID + " - ";
            if (user.FIRST_NAME != null) {
              user.name = user.name + user.FIRST_NAME + " ";
            }
            if (user.LAST_NAME != null) {
              user.name = user.name + user.LAST_NAME;
            }
          }
        });
        $scope.users = d;
      });
    };

    if ($rootScope.isAdmin) {
      getUserList();
    }

    $scope.getUser = function (user, $event) {
      $scope.isAddUser = false;
      $scope.role = "OU";
      ncList.getUserInfo(user, false).then(function (d) {
        $scope.data = d;
        $scope.admin = false;
        angular.forEach(d.roles, function (item) {
          if (item.appId == $rootScope.app) {
            if (item.name == "ADMIN") {
              $scope.admin = true;
            }
            if (item.name == "BA") {
              $scope.role = "BA";
            }
          }
        });

        if ($scope.role != "BA") {
          $scope.role = "OU";
        }
      });

      $(".admin .users li.active").removeClass("active");
      $($event.target).addClass("active");
    };

    $scope.addUser = function () {
      $scope.isAddUser = true;
      $scope.data = {
        manager: {},
      };
      $scope.role = "OU";
      $scope.admin = false;
    };

    $scope.submitUser = function () {
      var newUser = {
        user: {
          userId: $scope.data.userId,
          roles: [],
          business: $scope.data.business,
          manager: {
            userId: $scope.data.manager.userId,
          },
          phone: $scope.data.phone,
          email: $scope.data.email,
          firstName: $scope.data.firstName,
          lastName: $scope.data.lastName,
        },
        role: $scope.role,
        appId: $rootScope.app,
        admin: $scope.admin,
      };

      if ($scope.data.userId == "") {
        functions.alert("danger", "Please input SOE ID");
        return;
      }

      userService.newUser(newUser).then(function (d) {
        $(".admin .users li.active").removeClass("active");
        getUserList();
        functions.alert(
          "success",
          "User " + newUser.user.userId + " was add successfully"
        );
      });
    };

    $scope.checkUser = function () {
      userService.checkUser($scope.data.userId).then(function (d) {
        if (d.message) {
          functions.alert("danger", d.message);
          $scope.data.phone = "";
          $scope.data.email = "";
          $scope.data.firstName = "";
          $scope.data.lastName = "";
        } else {
          $scope.data.phone = d.phone;
          $scope.data.email = d.email;
          $scope.data.firstName = d.firstName;
          $scope.data.lastName = d.lastName;
        }
      });
    };
  },
]);

ncApp.controller("alertController", [
  "$scope",
  "$rootScope",
  function ($scope, $rootScope) {
    $scope.alert = {
      close: function () {
        $rootScope.successAlert = false;
      },
    };
  },
]);
