ncApp.factory('myInterceptor', ['$q', '$injector', '$rootScope', function($q, $injector, $rootScope) {
    return {
        
        response: function(res) {
            if (typeof res.data.indexOf == 'function') {
                if (res.data.indexOf instanceof Function &&
                    res.data.indexOf('SiteRoot Encoding=ISO-8859-1') != -1) {
                    var $window = $injector.get('$window');
                    $window.location.reload();
                }
            }
            return res;
        },
        responseError: function(response) {
            var $window = $injector.get('$window');
            console.log(response);
            console.log(res);
            console.log($window.location.hostname);
            if ($q2 === response.status) {
                
                $window.location.reload();
                
            } else if (response.status == 401) {
                $rootScope.showConfirm = true;
                $rootScope.confirm = {
                    heading: "Your account has expired, do you want to refresh and login?",
                    content: "",
                    yes: function () {
                        $rootScope.showConfirm = false;
                        $window.location.reload();
                    },
                    no: function () {
                        if($window.location.hostname.includes('lag-dev') || $window.location.hostname.includes('lag-sit')){
                            $window.location.href = "https://alt.secureaccountgh.nam.citgroup.net/idp/startSSO.ping";
                        } else if($window.location.hostname.includes('lag-uat')){
                            $window.location.href = "https://uat.secureaccountgh.nam.citgroup.net/idp/startSSO.ping";
                        } else {
                            $window.location.href = "https://secureaccountgh.nam.citgroup.net/idp/startSSO.ping";
                        }
                        $rootScope.showConfirm = false;
                    }
                };
            }
            if (response.status == 502) {
                var $http = $injector.get('$http');
                
                if(response.config.RetriesRemaining == undefined){
                    //do something on first error e.g. reporting
                    response.config.Retries = 1;
                    return $http(response.config);
                }else{
                    if(response.config.Retries!=2){
                        response.config.Retries = response.config.Retries +1;
                        return $http(response.config);
                    }else{
                    response.config.Retries = undefined;
                    //do something on last retry
                    return $q.reject(response);
                    }
                }
            }
            
            return $q.reject(response);
        }
    };
}]);

ncApp.config(['$httpProvider', function($httpProvider){
    $httpProvider.interceptors.push('myInterceptor');
}]);


ncApp.service('nzList', ['$http', 'functions', 'baseService', '$location', function ($http, functions, baseService, $location) {
    var nzList = {
        getList: function (searchBy) {
            let smUser = localStorage.getItem('SOEID');
            var response = $http({
            method: 'POST',
            url: "apis/" + "notification/search",
            data: searchBy,
            headers: { 'Content-Type': 'application/json', 'smUser': smUser }
        })
        
        return response;
    },
    getTotalNum: function (searchBy) {
        let smUser = localStorage.getItem('SOEID');
        var response = $http({
            method: 'POST',
            url: "apis/" + "notification/searchTotal",
            data: searchBy,
            headers: { 'Content-Type': 'application/json', 'smUser': smUser }
        })
        return response;
    },
    getStatusCountDashboard: function (searchBy) {
        var response = $http({
            method: 'POST',
            url: "apis/" + "notification/getStatusCountDashboard",
            data: searchBy,
            headers: { 'Content-Type': 'application/json' }
        })
        return response;
    },
    previewNotification: function (notificationId, templateId) {
        var response = $http.get("api/s" + "snapshot/notificationNotificationId=" + notificationId + '&templateId=' + templateId)
        
        return response;
    },
    viewNotification: function (notificationId, appId){
        var response = $http.get("apis/" + 'view/' + appId + '/' + notificationId)
        
        return response;
    },
    fullTextSearch: function (keyword, app) {
        let smUser = localStorage.getItem('SOEID');
        
        var response = $http({
            method: "GET",
            url: "apis/" + 'notification/fullTextSearchCriteria=' + keyword + '&appId=' + app,
            headers: { 'smUser': smUser }
        })
        
        return response;
    },
    NotificationId: -1,
    auditHistory: function () {
        var response = $http.get("apis/" + 'notification/auditHistory/' + this.NotificationId)
        return response;
    },
    getContactInfo: function (appID) {
        var response = $http.get("apis/" + 'notification/getContactInfo?appId=' + appID).then(function (response) {
            return response.data;
        });
        return response;
    },
    emailHistory: function () {
        var response = $http.get("apis/" + 'notification/emailHistory?notificationId=' + this.NotificationId);
        return response;
    },
    enableData: function (params) {
        let smUser = localStorage.getItem('SOEID');
        var response = $http({
            method: "get",
            url: "apis/" + "notification/effectiveStatus",
            // url: 'response/11.json',
            params: params,
            headers: { 'smUser': smUser }
        }).then(function (response) { return response.data; });
        return response;
    },
    nextTasks: function (params) {
        let smUser = localStorage.getItem('SOEID');
        var response = $http({
            method: "ns",
            url: "apis/" + "notification/nextTasks" + "?t=" + new Date().getTime(),
            params: params,
            headers: { 'smUser': smUser }
        }).then(function (response) { return response.data; });
        return response;
    },
    lastestSchedule: function () {
        var response = $http.get("apis/" + 'notification/lastestScheduleStatus').then(function (response) { return response.data; });
        return response;
    },
    getUser: function (userId) {
        console.log(userId)
        if(!userId){
            return new Promise((resolve=>resolve({fullName: ''})));
        }
        var cache = true;
        if (arguments.length == 2) {
            cache = false;
        }
        var response = $http.get("apis/" + 'user/' + userId, { cache: cache }).then(function (response) { return response.data; });
        return response;
    },
    getUserInfo: function (userId) {
        var response = $http.get("apis/" + 'user/' + userId + "?t=" + new Date().getTime()).then(function (response) { return response.data; });
        return response
    },
    reportReaders: function (notificationId, appId) {
        let smUser = localStorage.getItem('SOEID');
        var response = $http({
            method: "get",
            url: "apis/" + 'reader/report/' + appId + '/' + notificationId + "?t=" + new Date().getTime(),
            headers: { 'smUser': smUser }
        })
        
        return response;
    },
    attestationActiveUser: function () {
        var response = $http.get("apis/" + 'reader/info').then(function (response) { return response.data; })
        return response;
    },
    attestationConfirm: function (appId, displayNotificationId, notificationId) {
        var response = $http.get("apis/" + 'reader/confirm?appId=' + appId + '&displayNotificationId=' + displayNotificationId + '&notificationId=' + notificationId);
        return response;
    },
    attestationLogin: function (data) {
        var response = $http({
            method: 'POST',
            url: "apis/" + "reader/login",
            data: data,
            headers: { 'Content-Type': 'application/json' }
        }).then(function (response) { return response.data; });
        return response;
    }
    
};
return nzList;
}]);

ncApp.service('acFormData', ['$http', 'functions', 'baseService', function ($http, functions, baseService) {
    
    var nzList = {
        action: "CREATE",     //can be "create" or "update"
        datField: function (id) {
            var response = $http({
                method: "get",
                url: "apis/" + "template/" + id + "/fields"
            })
            
            return response;
        },
        postForm: function (data) {
            let smUser = localStorage.getItem('SOEID');
            var xx = $http({
                method: 'POST',
                url: "apis/" + "notification",
                data: data,
                headers: { 'Content-Type': 'application/json', 'smUser': smUser}
            })
            return xx;
        },
        editForm: function (data, id) {
            let smUser = localStorage.getItem('SOEID');
            var xx = $http({
                method: 'POST',
                url: "apis/" + "notification/edit/" + id,
                data: data,
                headers: { 'Content-Type': 'application/json', 'smUser': smUser }
            })
            return xx;
        },
        editStatus: function(status, id){
            let smUser = localStorage.getItem('SOEID');
            var xx = $http({
                method: 'POST',
                url: "apis/" + "notification/editStatus/" + id + '?status=' + status,
                data: {status: status},
                headers: { 'Content-Type': 'application/json', 'smUser': smUser }
            })
            return xx;
        },
        previewForm: function (data) {
            var xx = $http({
                method: 'POST',
                url: "apis/" + "snapshot/notification",
                data: data,
                headers: { 'Content-Type': 'application/json' }
            })
            return xx;
        },
        step1Validated: false,
        step2Validated: false,
        cacheForm: {}, //data to be post to server
        getNotification: function (id) {
            var response = $http.get("apis/" + "notification/" + id + "?t=" + new Date().getTime()).then(function (response) { return response.data; });
            return response;
        },
        getNotificationByDisplayId: function (appId, displayId) {
            var response = $http.get("apis/" + "notification/" + appId + '/' + displayId + "?t=" + new Date().getTime()).then(function (response) { return response.data; });
            return response;
        },
        sendEmail: function (id) {
            let smUser = localStorage.getItem('SOEID');
            var response = $http({
                method: 'get',
                url: "apis/" + 'snapshot/sendMailNotificationId=' + id + "?t=" + new Date().getTime(),
                headers: { 'smUser': smUser }
            }).then(function (response) { return response.data; });
            return response;
        },
        sendEmailToMe: function (id) {
            let smUser = localStorage.getItem('SOEID');
            var response = $http({
                method: 'get',
                url: "apis/" + 'snapshot/sendMailToMeNotificationId=' + id + "?t=" + new Date().getTime(),
                headers: { 'smUser': smUser }
            }).then(function (response) { return response.data; });
            return response;
        },
        activateSchedule: function (id) {
            let smUser = localStorage.getItem('SOEID');
            var response = $http({
                method: 'POST',
                url: "apis/" + "notification/activate",
                data: $.param({ notificationId: id }),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'smUser': smUser}
            })
            return response;
        },
        inActivateSchedule: function (id) {
            let smUser = localStorage.getItem('SOEID');
            var response = $http({
                method: 'POST',
                url: "apis/" + "notification/inactivate",
                data: $.param({ notificationId: id }),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'smUser': smUser }
            })
            return response;
        },
        getFeeddara: function (datatype, appId) {
            var response = $http.get("apis/" + "notification/dataserviceAppid=" + appId + "&datatype=" + datatype + "?t=" + new Date().getTime()).then(function (response) {
                return response.data; });
            return response;
        }
        
    };
    return noFormData;
}]);

ncApp.service("settingService", ["$http", "$location", "$modal", function ($http, $location, $modal) {
    var xxx = {
        domain: function (app, callback) {
            $http.get("apis/" + 'domain?id=' + app, { cache: true }).success(callback).error(function (data, status) {
                console.log(data, status);
            });
        },
        deleteDomainValue: function (id) {
            var response = $http.post("apis/" + 'domain/delete?domainValueId=' + id).then(function (response) { return response.data; });
            return response;
        },
        deleteCatValue: function (id) {
            var response = $http.post("apis/" + 'category/delete?categoryValueId=' + id).then(function (response) { return response.data; });
            return response;
        },
        addDomainValue: function (data) {
            var response = $http({
                method: 'POST',
                url: "apis/" + "domain",
                data: data,
                headers: { 'Content-Type': 'application/json' }
            });
            return response;
        },
        addCategoryValue: function (data) {
            var request = $http({
                method: 'POST',
                url: "apis/" + "category",
                data: data,
                headers: { 'Content-Type': 'application/json' }
            });
            return request;
        }
    };
    return xxx;
}]);

ncApp.service("subscriptionService", ["$http", function ($http) {
    var subscription = {
        subIds: -1,
        auditHistory: function (id) {
            var response = $http.get("apis/" + "subscription/his/" + this.subId + "?t=" + new Date().getTime()).then(function (response) { return response.data; });
            return response;
        },
        submitForm: function (data) {
            let smUser = localStorage.getItem('SOEID');
            var xx = $http({
                method: 'POST',
                url: "apis/" + "subscription",
                data: data,
                headers: { 'Content-Type': 'application/json', 'smUser': smUser }
            });
            return xx;
        },
        export: function (component, queryData) {
            let xhr = new XMLHttpRequest();
            let params = ""
            Object.keys(queryData).forEach(key=>{
                params += "&" + key + '=' + Object.getOwnPropertyDescriptor(queryData,key)?.value
            })
            xhr.open('GET', "apis/" + "subscription/export" + "?r=" + new Date().getTime() + params, true);
            xhr.responseType ='blob'
            xhr.setRequestHeader('content-type', 'application/json');
            xhr.onload = function () {
                if (this.status === 200) {
                    let filename = this.getResponseHeader('content-disposition')?.split('/')[1].split('-')[1];
                    var blob = this.response;
                    var reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onload = function (e) {
                        if(e.target?.result != null){
                            var a = document.createElement('a');
                            a.download = filename?fileName:'';
                            a.href = e.target?.result.toString()
                            a.click()
                            resolve('success')
                        }
                    }
                }
            }
            xhr.send(JSON.stringify(queryData))
        },
        updateform: function (data, id) {
            let smUser = localStorage.getItem('SOEID');
            console.log('smUser ->', smUser);
            var response = $http({
                method: 'POST',
                url: "apis/" + "subscription/edit/" + id,
                data: data,
                headers: { 'Content-Type': 'application/json', 'smUser': smUser }
            }).then(function (response) {
                return response.data;
            });
            return response;
        },
        createSubscription: function (subscriptionDto) {
            let smUser = localStorage.getItem('SOEID');
            const response = $http({
                method: 'POST',
                url: "apis/subscription",
                data: subscriptionDto,
                headers: { 'Content-Type': 'application/json', 'smUser': smUser }
            }).then(function (response) {
                return response.data;
            });
            return response;
        },
        getSubscription: function (id) {
            var response = $http.get("apis/" + "subscription/" + id + "?t=" + new Date().getTime()).then(function (response) { return response.data; });
            return response;
        },
        deleteSubscription: function (id) {
            var xx = $http({
                method: 'POST',
                url: "apis/" + "subscription/delete/" + id,
                data: null,
                headers: { 'Content-Type': 'application/json', 'smUser': smUser }
            });
            return xx;
        },
        action: "CREATE"
    };
    return subscription;
}]);

ncApp.service("supportService", ['$http', function ($http) {
    
    var supportService = {
        runSql: function (sql) {
            var response = $http.post("apis/" + "util/executeSql", sql, { 'Content-Type': 'application/json' })
            
            return response;
        }
    };
    return supportService;
}]);

ncApp.service("userService", ["$http", function ($http) {
    var login = {
        getInfo: function() {
            let smUser = localStorage.getItem('SOEID');
            var response = $http({
                method: 'GET',
                url: "apis/" + "user/getInfo",
                headers: { 'smUser': smUser }
            }).then(function (response) { return response.data; });
            return response;
        },
        whoami: function () {
            var response = $http({
                method: 'GET',
                url: "apis/" + 'user/whoami',
            }).then(function (response) { return response; });
            return response;
        },
        userProfile: function (id) {
            var response = $http.get("apis/" + 'user/' + id + "?t=" + new Date().getTime()).then(function (response) { return response.data; });
            return response;
        },
        updateProfile: function (data) {
            var response = $http.post("apis/" + "user/edit", data, { 'Content-Type': 'application/json' }).then(function (response) {
                return response.data;
            });
            return response;
        },
        newUser: function (data) {
            var response = $http.post("apis/" + "user/newUser", data, { 'Content-Type': 'application/json' }).then(function (response) {
                return response.data;
            });
            return response;
        },
        checkUser: function (soeId) {
            var response = $http.get("apis/" + "user/checkUser/" + soeId).then(function (response) {
                return response.data;
            });
            return response;
        },
        checkAppId: function() {
            var response = $http.get("apis/" + "application/get").then(function (response) {
                return response.data;
            });
            return response;
        }
    };
    return login;
}]);

ncApp.service("adminService", ["$http", "$rootScope", "$location", "$modal", function ($http, $rootScope, $location, $modal) {
    var admin = {
        setUserRole: function (data) {
            var response = $http({
                method: "post",
                url: "apis/" + "user/applyRole/edit",
                params: data
            });
            return response;
        },
        getUserRoles: function (query) {
            var response = $http({
                url: "apis/" + "user" + "?t=" + new Date().getTime(),
                method: "get"
            }).error(function (data, status) {
                
            });
            return response;
        }
    };
    return admin;
}]);

ncApp.service("baseService", ['$http', '$location', '$rootScope', '$modal', function ($http, $location, $rootScope, $modal) {
    var base = {
        getSubscription: function (component, queryData) {
            var response = $http({
                method: "get",
                url: "apis/" + "subscription" + "?t=" + new Date().getTime(),
                params: queryData
            }).error(function (data, status, headers, config) {
                if(status == 302) {
                    $route.reload()
                } else {
                    var message = baseService && baseService.errorMessage;
                    if (data.exceptionMessage) {
                        message = data.exceptionMessage;
                    }
                    functions.alert("danger", message);
                }
            });
            return response;
        },
        getFeedBack: function(notificationId){
            var response = $http.get("apis/" + 'notification/feedback/' + notificationId).then(function (response) { return response.data; });
            return response;
        },
        getFeedBackList: function(notificationId){
            var response = $http.get("apis/" + 'notification/feedback/list/' + notificationId).then(function (response) { return response.data; });
            return response;
        },
        submitFeedback: function (data) {
            const smUser = localStorage.getItem('SOEID');
            var xx = $http({
                method: 'POST',
                url: "apis/" + "notification/feedback",
                data: data,
                headers: { 'Content-Type': 'application/json', 'smUser': smUser }
            });
            return xx;
        },
        getTemplates: function (app, callback) {
            $http.get("apis/" + 'templatetype?appId=' + app, { cache: true }).success(callback).error(function (data, status) {
                
            });
        },
        getCategories: function (app) {
            var response = $http.get("apis/" + 'category?appId=' + app, { cache: true }).then(function (response) { return response.data; });
            return response;
        },
        categoryValues: function (id) {
            var cache = true;
            if (arguments.length == 2) {
                cache = false;
            }
            var response = $http.get("apis/" + 'category/' + id, { cache: cache }).then(function (response) {
                var result = {
                    values: response.data.values,
                    specialCategoryValue: response.data.specialCategoryValue
                }
                if (result.specialCategoryValue) {
                    result.values.forEach(result.values, function (value, i) {
                        if (result.specialCategoryValue.categoryValueId == value.categoryValueId) {
                            result.values.splice(i, 1);
                        }
                    });
                }
                return result.values;
            });
            return response;
        },
        categoryValueTemplate: function (templateId, appId) {
            var response = $http.get("apis/" + "subscription/categories?templateTypeId=" + templateId + '&appId=' + appId, { cache: true }).then(function (response) {
                angular.forEach(response.data, function (category) {
                    if (category.specialCategoryValue) {
                        angular.forEach(category.values, function (categoryValue, i) {
                            if (categoryValue.categoryValueId == category.specialCategoryValue.categoryValueId) {
                                category.specialCategoryValue.categoryName = category.categoryName;
                                category.specialCategoryValue.categoryId = categoryValue.categoryId;
                                category.values.splice(i, 1);
                            }
                        });
                    }
                });
                return response.data;
            });
            return response;
        },
        domain: function (app) {
            return $http.get("apis/" + 'domain?appId=' + app, { cache: true }).then(function (response) {
                return response.data;
            });
        },
        domainValues: function (id) {
            var cache = true;
            if (arguments.length == 2) {
                cache = false;
            }
            var response = $http.get("apis/" + 'domain/' + id, { cache: cache }).then(function (response) {
                var result = {
                    values: response.data.values,
                    specialDomainValue: response.data.specialDomainValue
                };
                if (result.specialDomainValue) {
                    angular.forEach(result.values, function (value, i) {
                        if(result.specialDomainValue.domainValueId == value.domainValueId) {
                            result.values.splice(i, 1);
                        }
                    });
                }
                return result;
            });
            return response;
        },
        toAddress: function (notificationId) {
            var response = $http.get("apis/" + 'notification/' + notificationId + '/subscriptionAddress' + "?t=" + new Date().getTime()).then(function (response) { 
                return response.data;
            });
            return response;
        },
        getNextFireTime: function (notificationId) {
            var response = $http.get("apis/" + 'notification/getNextFireTimeNotificationId=' + notificationId + "?t=" + new Date().getTime());
            return response;
        },
        getTimezone: function () {
            var response = $http.get('js/timezone.json').then(function (response) { return response.data; });
            return response;
        },
        errorMessage: "An error has occurred, please try your operation one more time, if the problem still exists, please contact application support."
    };
    return base;
}]);

ncApp.service("functions", ["$rootScope", function ($rootScope) {
    return {
        toNCList: function (d) {
            angular.forEach(d, function (item, index) {
                d[index].categories = [];
                angular.forEach(item.fieldValues, function (field, fieldIndex) {
                    if (field.valueType == 'CATEGORY') {
                        if (field.values.length > 2) {
                            d[index].categories.push(field.values[0,2]);
                            field.values.push("...");
                        }
                        field.values = field.values.slice(0,2);
                        d[index].categories.push(field);
                    }
                    if (field.name == 'Business Driver' || field.name == 'Description') {
                        d[index].description = field.values[0].value;
                    }
                    if (field.name == 'description') {
                        if (field.values[0].value == null) {
                            
                        } else {
                            d[index].title = field.values[0].value;
                        }
                    }
                });
                if (item.effectiveDate != null) {
                    if (item.effectiveDate == "") {
                        item.effectiveDate = "";
                    } else {
                        item.effectiveDate = getUTCDateString(item.effectiveDate);
                    }
                }
                if (item.effectiveType == 'RANGE_DATE') {
                    if (item.effectiveDate == null) {
                        item.effectiveDate = "";
                    } else {
                        item.effectiveDate = getUTCDateString(item.effectiveDate);
                    }
                    if (item.effectiveEndDate == null) {
                        item.effectiveEndDate = "";
                    } else {
                        item.effectiveEndDate = getUTCDateString(item.effectiveEndDate);
                    }
                }
            });
            return d;
        },
        getValueById: function (objList, id, value, input) {
            var output;
            angular.forEach(objList, function (obj) {
                if (obj[id] == input) {
                    output = obj[value];
                }
            });
            return output;
        },
        alert: function (type, message, callback) {
            $rootScope.successAlert = true;
            $rootScope.message = message;
            $rootScope.alertType = "alert-" + type;
            if (type == 'success') {
                setTimeout(function () {
                    $rootScope.successAlert = false;
                    $rootScope.$apply();
                    if (typeof callback !== 'undefined') {
                        callback();
                    }
                }, 5000);
            }
        },
        isBa: function (appId) {
            var roles = JSON.parse(localStorage.getItem('isba'));
            console.log(roles)
            var ba = false;
            angular.forEach(roles.app, function (role) {
                if ($rootScope.app == role.appId && role.name == 'BA') {
                    ba = true;
                }
            });
            return ba;
        },
        isAdmin: function (appId) {
            var roles = JSON.parse(localStorage.getItem('isBa'));
            var admin = false;
            angular.forEach(roles, function (role) {
                if ($rootScope.app == role.appId && role.name == 'ADMIN') {
                    admin = true;
                }
            });
            return admin;
        },
        isSupport: function (appId) {
            var roles = JSON.parse(localStorage.getItem('isBa'));
            var support = false;
            angular.forEach(roles, function (role) {
                if (role.name == 'SUPPORT') {
                    support = true;
                }
            });
            return support;
        },
        getWarningMessageWhenSendEmail: function (notification) {
            var isLater = false;
            if(notification.effectiveType == 'DATE'){
                var laterTodayTime = notification.effectiveDate + 86400000 - 1;
                if (laterTodayTime < new Date().getTime()){
                    isLater = true;
                }
            } else if (notification.effectiveType == 'TIMESTAMP') {
                if (notification.effectiveDate < new Date().getTime()) {
                    isLater = true;
                }
            } else if (notification.effectiveType == 'RANGE_DATE' || notification.effectiveType == 'RANGE_TIMESTAMP') {
                if (notification.effectiveEndDate < new Date().getTime()) {
                    isLater = true;
                }
            }
            if (isLater) {
                return "<span class='text-danger'>Please notice that the effective date has passed.</span><br/>"
            } else {
                return "";
            }
        }
    };
}]);

Array.prototype.unique = function () {
    var a = this.concat();
    for (var i = 0; i < a.length; ++i) {
        for (var j = i + 1; j < a.length; ++j) {
            if (a[i] === a[j])
                a.splice(j--, 1);
        }
    }
    return a;
};

Array.prototype.include = function (id) {
    if(this.length == 0){return -1;}
    // if (id < 0)
    var x = [];
    for (var i = 0; i < this.length; i++) {
        x.push("" + this[i].categoryValueId);
    }
    return x.indexOf(id);
};

Array.prototype.includeObjectBy = function (key, value) {
    value = "" + value;
    var x = [];
    for (var i = 0; i < this.length; i++) {
        x.push(""+this[i][key]);
    }
    return x.indexOf(value);
};

//[[a1:b1},{a2, b1}]]  when a>2 =>b?
Array.prototype.getValueByKey = function (key, keyValue, b) {
    for (var i = 0; i < this.length; i++) {
        if (this[i][key] == keyValue) {
            var key2Value = this[i][key2];
        }
    }
    return key2Value;
};

Array.prototype.countObjectBy = function (key, value) {
    value = "" + value;
    var x = []; count = 0;
    for (var i = 0; i < this.length; i++) {
        // x.push(""+this[i][key]);
        if (this[i][key] == value) count++;
    }
    return count;
};

Date.prototype.format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds()
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

Date.prototype.dateWithTimeZone = function () {
    // var day = this.toLocaleDateString();
    var day = dateToString(this, '/');
    var time = this.toLocaleTimeString();
    time = time.substring(0, 17);
    var x = day + " " + time;
    return x;
};

Number.prototype.toLocalDate = function () {
    var d = new Date();
    var timeZoneOffset = d.getTimezoneOffset();   //min
    var timeOffset = timeZoneOffset * 60000;
    return this + timeZoneOffset;
};

function getUTCDateString(timestamp) {
    var d = new Date(timestamp);
    var dateString = d.getUTCFullYear() + "/" + (d.getUTCMonth() + 1) + "/" + d.getUTCDate();
    return dateString;
}

function highlight(node) {
    node = $(node);
    // if checked; do nothing
    if (node.hasClass("label")) {
        node.removeClass("label label-default");
    } else {
        
        // if uncheck, first check,
        node.addClass("label label-default");
        
        // if it's 'all', uncheck others,
        // if it's others, uncheck all.
        if (node.hasClass("all")) {
            node.parent().siblings().find("a.label").removeClass("label label-default");
        } else if (node.hasClass("exclusive")) {
            node.parent().siblings().find("a.label").removeClass("label label-default");
        } else {
            node.parent().siblings().find("a.all").removeClass("label label-default");
        }
    }
    
    //end if
}

function dateString(node) {
    var year = date.getFullYear();   //getYear not compatible Chrome
    var month = date.getMonth();
    var day = date.getDate();
    if (month < 10) { month = '0' + month + 1};
    if ( day < 10) { day = '0' + day};
    if ( month < 10) { month = '0' + (month + 1); }
    
    var dateString = month + sep + day + sep + year;
    return dateString;
}

function highlight2(node) {
    node = $(node);
    // if checked; do nothing
    if (node.hasClass("label")) {
        node.removeClass("label label-default");
    } else {
        
        // if uncheck, first check,
        node.addClass("label label-default");
        
        // if it's 'all', uncheck others,
        // if it's others, uncheck all.
        if (node.hasClass("all")) {
            node.parent().siblings().find("a.label").removeClass("label label-default");
        } else if (node.hasClass("exclusive")) {
            node.parent().siblings().find("a.label").removeClass("label label-default");
        } else {
            node.parent().siblings().find("a.all").removeClass("label label-default");
        }
    }
    
    //end if
}
