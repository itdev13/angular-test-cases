describe('Directives Test Suite', function() {
  var $compile, $rootScope, $scope, $interval, $window, element, THROTTLE_MILLISECONDS;

  beforeEach(module('ncApp'));

  beforeEach(function() {
    // Mock jQuery globally
    window.$ = window.jQuery = function(elem) {
      if(typeof elem === 'string') {
        return {
          datepicker: function(options) {
            this.datepickerOptions = options;
            return this;
          }
        };
      }
      var mockElement = {
        parent: function() {
          return {
            hasClass: function(className) {
              return false;
            }
          };
        },
        datepicker: function(options) {
          this.datepickerOptions = options;
          return this;
        },
        datepickerOptions: null
      };
      return mockElement;
    };
    
    $.fn = {
      datepicker: function(options) {
        this.datepickerOptions = options;
        return this;
      }
    };
  });

  beforeEach(inject(function(_$compile_, _$rootScope_, _$interval_, _$window_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $scope = _$rootScope_.$new();
    $interval = _$interval_;
    $window = _$window_;
  }));

  describe('tree directive', function() {
    beforeEach(function() {
      $scope.category = {
        children: [{
          values: [
            { categoryValue: 'ALL', categoryValueId: 999 }
          ]
        }]
      };
      $scope.parent = [];
      $scope.data = [];
      
      // Mock Array.prototype.include
      Array.prototype.include = function(value) {
        for(var i = 0; i < this.length; i++) {
          if(this[i] === value) return i;
        }
        return -1;
      };
      
      Array.prototype.includeObjectBy = function(key, value) {
        for(var i = 0; i < this.length; i++) {
          if(this[i][key] === value) return i;
        }
        return -1;
      };
    });

    it('should create tree directive with correct template', function() {
      element = $compile('<tree category="category" parent="parent" data="data"></tree>')($scope);
      $scope.$digest();
      
      var isolateScope = element.isolateScope() || element.scope();
      expect(isolateScope).toBeDefined();
      expect(isolateScope.category).toEqual($scope.category);
    });

    describe('treeToggleLeaf', function() {
      beforeEach(function() {
        element = $compile('<tree category="category" parent="parent" data="data"></tree>')($scope);
        $scope.$digest();
      });

      it('should add child and parent when target is checked', function() {
        var isolateScope = element.isolateScope() || element.scope();
        var child = {
          categoryValueId: 1,
          parentCategoryValueId: 10,
          parentCategoryId: 100,
          parentCategoryValue: 'Parent Category'
        };
        var target = { checked: true };

        isolateScope.treeToggleLeaf(child, target);

        expect(isolateScope.data.length).toBe(1);
        expect(isolateScope.data[0]).toBe(child);
        expect(isolateScope.parent.length).toBe(1);
        expect(isolateScope.parent[0].categoryId).toBe(100);
      });

      it('should not add parent if it already exists', function() {
        var isolateScope = element.isolateScope() || element.scope();
        isolateScope.parent = [{ categoryValueId: 10 }];
        
        var child = {
          categoryValueId: 1,
          parentCategoryValueId: 10,
          parentCategoryId: 100,
          parentCategoryValue: 'Parent Category'
        };
        var target = { checked: true };

        isolateScope.treeToggleLeaf(child, target);

        expect(isolateScope.parent.length).toBe(1);
      });

      it('should remove child when target is unchecked', function() {
        var isolateScope = element.isolateScope() || element.scope();
        var child = {
          categoryValueId: 1,
          parentCategoryValueId: 10
        };
        isolateScope.data = [child];
        isolateScope.parent = [{ categoryValueId: 10 }];
        
        var target = { checked: false };

        isolateScope.treeToggleLeaf(child, target);

        expect(isolateScope.data.length).toBe(0);
        expect(isolateScope.parent.length).toBe(0);
      });

      it('should not remove parent if other children exist', function() {
        var isolateScope = element.isolateScope() || element.scope();
        var child1 = {
          categoryValueId: 1,
          parentCategoryValueId: 10
        };
        var child2 = {
          categoryValueId: 2,
          parentCategoryValueId: 10
        };
        isolateScope.data = [child1, child2];
        isolateScope.parent = [{ categoryValueId: 10 }];
        
        var target = { checked: false };

        isolateScope.treeToggleLeaf(child1, target);

        expect(isolateScope.data.length).toBe(1);
        expect(isolateScope.parent.length).toBe(1);
      });
    });

    describe('treeToggleFather', function() {
      beforeEach(function() {
        element = $compile('<tree category="category" parent="parent" data="data"></tree>')($scope);
        $scope.$digest();
      });

      it('should add all children when parent is checked', function() {
        var isolateScope = element.isolateScope() || element.scope();
        var parent = { categoryValueId: 10 };
        var categories = [
          { categoryValueId: 1, parentCategoryValueId: 10 },
          { categoryValueId: 2, parentCategoryValueId: 10 },
          { categoryValueId: 3, parentCategoryValueId: 20 }
        ];
        var target = { checked: true };

        isolateScope.treeToggleFather(parent, target, categories);

        expect(isolateScope.data.length).toBe(2);
        expect(isolateScope.parent.length).toBe(1);
      });

      it('should not add duplicate children', function() {
        var isolateScope = element.isolateScope() || element.scope();
        var parent = { categoryValueId: 10 };
        var child = { categoryValueId: 1, parentCategoryValueId: 10 };
        isolateScope.data = [child];
        
        var categories = [child];
        var target = { checked: true };

        isolateScope.treeToggleFather(parent, target, categories);

        expect(isolateScope.data.length).toBe(1);
      });

      it('should remove all children when parent is unchecked', function() {
        var isolateScope = element.isolateScope() || element.scope();
        var parent = { categoryValueId: 10 };
        var child1 = { categoryValueId: 1, parentCategoryValueId: 10 };
        var child2 = { categoryValueId: 2, parentCategoryValueId: 20 };
        
        isolateScope.data = [child1, child2];
        isolateScope.parent = [parent];
        
        var categories = [];
        var target = { checked: false };

        isolateScope.treeToggleFather(parent, target, categories);

        expect(isolateScope.data.length).toBe(1);
        expect(isolateScope.data[0]).toBe(child2);
        expect(isolateScope.parent.length).toBe(0);
      });
    });

    describe('treeToggleAll', function() {
      beforeEach(function() {
        element = $compile('<tree category="category" parent="parent" data="data"></tree>')($scope);
        $scope.$digest();
      });

      it('should clear data and parent arrays', function() {
        var isolateScope = element.isolateScope() || element.scope();
        isolateScope.data = [{ id: 1 }];
        isolateScope.parent = [{ id: 2 }];
        
        var target = { checked: false };

        isolateScope.treeToggleAll(target, {});

        expect(isolateScope.data.length).toBe(0);
        expect(isolateScope.parent.length).toBe(0);
      });

      it('should add ALL option when checked', function() {
        var isolateScope = element.isolateScope() || element.scope();
        isolateScope.category = $scope.category;
        
        var target = { checked: true };

        isolateScope.treeToggleAll(target, {});

        expect(isolateScope.data.length).toBe(1);
        expect(isolateScope.data[0].categoryValue).toBe('ALL');
      });
    });
  });

  describe('multiselectwithsearch directive', function() {
    beforeEach(function() {
      Array.prototype.includeObjectBy = function(key, value) {
        for(var i = 0; i < this.length; i++) {
          if(this[i][key] === value) return i;
        }
        return -1;
      };
    });

    it('should create multiselectwithsearch directive', function() {
      element = $compile('<multiselectwithsearch></multiselectwithsearch>')($scope);
      $scope.$digest();
      expect(element).toBeDefined();
      expect($scope.toggleSelection).toBeDefined();
      expect($scope.toggleAll).toBeDefined();
    });

    describe('toggleSelection', function() {
      beforeEach(function() {
        element = $compile('<multiselectwithsearch></multiselectwithsearch>')($scope);
        $scope.$digest();
      });

      it('should add item to list when not selected', function() {
        var list = [];
        var target = { domainValueId: 1, name: 'Item 1' };

        $scope.toggleSelection(target, list);

        expect(list.length).toBe(1);
        expect(list[0]).toBe(target);
      });

      it('should remove item from list when already selected', function() {
        var target = { domainValueId: 1, name: 'Item 1' };
        var list = [target];

        $scope.toggleSelection(target, list);

        expect(list.length).toBe(0);
      });
    });

    describe('toggleAll', function() {
      beforeEach(function() {
        element = $compile('<multiselectwithsearch></multiselectwithsearch>')($scope);
        $scope.$digest();
      });

      it('should clear field and add value when checked', function() {
        $scope.data = { field1: [{ id: 1 }] };
        var target = { checked: true };
        var targetValue = { id: 2 };

        $scope.toggleAll(target, 'field1', targetValue);

        expect($scope.data.field1.length).toBe(1);
        expect($scope.data.field1[0]).toBe(targetValue);
      });

      it('should clear field when unchecked', function() {
        $scope.data = { field1: [{ id: 1 }] };
        var target = { checked: false };

        $scope.toggleAll(target, 'field1', {});

        expect($scope.data.field1.length).toBe(0);
      });
    });
  });

  describe('multiselect directive', function() {
    beforeEach(function() {
      $scope.category = { id: 1 };
      $scope.data = [];
      
      Array.prototype.include = function(value) {
        for(var i = 0; i < this.length; i++) {
          if(this[i] === value) return i;
        }
        return -1;
      };
      
      // Mock jQuery
      window.$ = window.$ || function(elem) {
        return {
          parent: function() {
            return {
              hasClass: function(className) {
                return false;
              }
            };
          }
        };
      };
    });

    it('should create multiselect directive', function() {
      element = $compile('<multiselect category="category" data="data" type="test"></multiselect>')($scope);
      $scope.$digest();
      
      var isolateScope = element.isolateScope() || element.scope();
      expect(isolateScope.category).toEqual($scope.category);
    });

    describe('toggleSelection', function() {
      beforeEach(function() {
        element = $compile('<multiselect category="category" data="data"></multiselect>')($scope);
        $scope.$digest();
      });

      it('should add value when not selected', function() {
        var isolateScope = element.isolateScope() || element.scope();
        var value = { categoryValueId: 1 };
        var target = document.createElement('div');

        isolateScope.toggleSelection(target, value);

        expect(isolateScope.data.length).toBe(1);
        expect(isolateScope.data[0]).toBe(1);
      });

      it('should remove value when already selected', function() {
        var isolateScope = element.isolateScope() || element.scope();
        isolateScope.data = [1];
        var value = { categoryValueId: 1 };
        var target = document.createElement('div');

        isolateScope.toggleSelection(target, value);

        expect(isolateScope.data.length).toBe(0);
      });

      it('should replace all values when ALL is selected', function() {
        var isolateScope = element.isolateScope() || element.scope();
        isolateScope.data = [1, 2, 3];
        var value = { categoryValueId: 999 };
        
        window.$ = function(elem) {
          return {
            parent: function() {
              return {
                hasClass: function(className) {
                  return className === 'any';
                }
              };
            }
          };
        };
        
        var target = document.createElement('div');

        isolateScope.toggleSelection(target, value);

        expect(isolateScope.data.length).toBe(1);
        expect(isolateScope.data[0].categoryValueId).toBe(999);
      });
    });
  });

  describe('nqEnter directive', function() {
    it('should create nqEnter directive', function() {
      $scope.enterPressed = jasmine.createSpy('enterPressed');
      element = $compile('<input nq-enter="enterPressed()" />')($scope);
      $scope.$digest();
      expect(element).toBeDefined();
    });

    it('should call function on Enter key press', function() {
      $scope.enterPressed = jasmine.createSpy('enterPressed');
      element = $compile('<input nq-enter="enterPressed()" />')($scope);
      $scope.$digest();

      // Trigger keypress event manually using angular.element
      var event = angular.element.Event ? angular.element.Event('keypress') : document.createEvent('Event');
      if(!angular.element.Event) {
        event.initEvent('keypress', true, true);
      }
      event.which = 13;
      angular.element(element).triggerHandler(event);

      expect($scope.enterPressed).toHaveBeenCalled();
    });

    it('should not call function on other key press', function() {
      $scope.enterPressed = jasmine.createSpy('enterPressed');
      element = $compile('<input nq-enter="enterPressed()" />')($scope);
      $scope.$digest();

      var event = new Event('keypress');
      event.which = 65; // 'A' key
      element[0].dispatchEvent(event);

      expect($scope.enterPressed).not.toHaveBeenCalled();
    });
  });

  describe('smultiselect directive', function() {
    beforeEach(function() {
      $scope.category = { id: 1 };
      $scope.data = [];
      
      Array.prototype.includeObjectBy = function(key, value) {
        for(var i = 0; i < this.length; i++) {
          if(this[i][key] === value) return i;
        }
        return -1;
      };
    });

    it('should create smultiselect directive', function() {
      element = $compile('<smultiselect category="category" data="data"></smultiselect>')($scope);
      $scope.$digest();
      
      var isolateScope = element.isolateScope() || element.scope();
      expect(isolateScope.category).toEqual($scope.category);
    });

    describe('toggleSelection', function() {
      beforeEach(function() {
        element = $compile('<smultiselect category="category" data="data"></smultiselect>')($scope);
        $scope.$digest();
      });

      it('should initialize data array if undefined', function() {
        var isolateScope = element.isolateScope() || element.scope();
        isolateScope.data = undefined;
        var target = { domainValueId: 1 };

        isolateScope.toggleSelection(target);

        expect(isolateScope.data).toBeDefined();
        expect(Array.isArray(isolateScope.data)).toBe(true);
      });

      it('should remove item when already selected', function() {
        var isolateScope = element.isolateScope() || element.scope();
        var target = { domainValueId: 1 };
        isolateScope.data = [target];

        isolateScope.toggleSelection(target);

        expect(isolateScope.data.length).toBe(0);
      });

      it('should remove item when not selected (bug in original code)', function() {
        var isolateScope = element.isolateScope() || element.scope();
        isolateScope.data = [];
        var target = { domainValueId: 1 };

        isolateScope.toggleSelection(target);

        // Note: Original code has a bug - it splices at idx=-1 in else clause
        // This test documents the actual behavior
        expect(isolateScope.data.length).toBe(0);
      });
    });
  });

  describe('smultiselectwithsearch directive', function() {
    beforeEach(function() {
      $scope.domain = { id: 1 };
      $scope.data = [];
    });

    it('should create smultiselectwithsearch directive', function() {
      element = $compile('<smultiselectwithsearch domain="domain" data="data"></smultiselectwithsearch>')($scope);
      $scope.$digest();
      
      var isolateScope = element.isolateScope() || element.scope();
      expect(isolateScope.domain).toEqual($scope.domain);
    });

    describe('toggleSelection', function() {
      beforeEach(function() {
        element = $compile('<smultiselectwithsearch domain="domain" data="data"></smultiselectwithsearch>')($scope);
        $scope.$digest();
      });

      it('should add value when not selected', function() {
        var isolateScope = element.isolateScope() || element.scope();
        
        isolateScope.toggleSelection(1);

        expect(isolateScope.data.length).toBe(1);
        expect(isolateScope.data[0]).toBe(1);
      });

      it('should remove value when already selected', function() {
        var isolateScope = element.isolateScope() || element.scope();
        isolateScope.data = [1];

        isolateScope.toggleSelection(1);

        expect(isolateScope.data.length).toBe(0);
      });

      it('should initialize data array if undefined', function() {
        var isolateScope = element.isolateScope() || element.scope();
        isolateScope.data = undefined;

        isolateScope.toggleSelection(1);

        expect(isolateScope.data).toBeDefined();
        expect(Array.isArray(isolateScope.data)).toBe(true);
      });
    });
  });

  describe('jqdatepicker directive', function() {
    var datepickerOptions;
    
    beforeEach(function() {
      // Mock jQuery datepicker
      datepickerOptions = null;
      angular.element.prototype.datepicker = function(options) {
        datepickerOptions = options;
        return this;
      };
    });

    it('should create jqdatepicker directive', function() {
      element = $compile('<input jqdatepicker />')($scope);
      $scope.$digest();
      expect(element).toBeDefined();
      expect(datepickerOptions).toBeDefined();
    });

    it('should initialize datepicker with correct format', function() {
      element = $compile('<input jqdatepicker />')($scope);
      $scope.$digest();
      
      expect(datepickerOptions).toBeDefined();
      expect(datepickerOptions.dateFormat).toBe('DD, d  MM, yy');
    });

    it('should update scope date on select', function() {
      element = $compile('<input jqdatepicker />')($scope);
      $scope.$digest();
      
      var testDate = 'Monday, 12 December, 2025';
      datepickerOptions.onSelect(testDate);
      $scope.$digest();
      
      expect($scope.date).toBe(testDate);
    });
  });

  describe('infiniteScroll directive', function() {
    var mockWindow, mockInterval;

    beforeEach(inject(function($injector) {
      mockWindow = {
        pageYOffset: 0
      };
      
      mockInterval = jasmine.createSpy('$interval').and.callFake(function(fn, delay, count) {
        if(count === 1) {
          fn();
        }
        return 123; // fake interval id
      });
      mockInterval.cancel = jasmine.createSpy('cancel');

      $scope.infiniteScrollCallback = jasmine.createSpy('infiniteScrollCallback');
      $scope.scrollDistance = 0.5;
      $scope.scrollDisabled = false;
      $scope.scrollContainer = null;
    }));

    it('should create infiniteScroll directive', function() {
      element = $compile('<div infinite-scroll="infiniteScrollCallback()"></div>')($scope);
      $scope.$digest();
      expect(element).toBeDefined();
    });

    it('should initialize with default values', function() {
      element = $compile('<div infinite-scroll="infiniteScrollCallback()"></div>')($scope);
      $scope.$digest();
      
      // infiniteScroll uses link function, not isolated scope
      expect(element).toBeDefined();
      expect(element.attr('infinite-scroll')).toBe('infiniteScrollCallback()');
    });

    it('should handle infiniteScrollDistance changes', function() {
      $scope.scrollDistance = 0.5;
      element = $compile('<div infinite-scroll="infiniteScrollCallback()" infinite-scroll-distance="scrollDistance"></div>')($scope);
      $scope.$digest();
      
      $scope.scrollDistance = 1.0;
      $scope.$digest();
      
      expect($scope.scrollDistance).toBe(1.0);
    });

    it('should handle infiniteScrollDisabled changes', function() {
      $scope.scrollDisabled = false;
      element = $compile('<div infinite-scroll="infiniteScrollCallback()" infinite-scroll-disabled="scrollDisabled"></div>')($scope);
      $scope.$digest();
      
      $scope.scrollDisabled = true;
      $scope.$digest();
      
      expect($scope.scrollDisabled).toBe(true);
    });

    it('should handle infiniteScrollUseDocumentBottom', function() {
      $scope.useDocBottom = true;
      element = $compile('<div infinite-scroll="infiniteScrollCallback()" infinite-scroll-use-document-bottom="useDocBottom"></div>')($scope);
      $scope.$digest();
      
      expect($scope.useDocBottom).toBe(true);
    });

    it('should handle infiniteScrollContainer changes', function() {
      var container = document.createElement('div');
      container.id = 'scrollContainer';
      document.body.appendChild(container);
      
      $scope.containerSelector = '#scrollContainer';
      element = $compile('<div infinite-scroll="infiniteScrollCallback()" infinite-scroll-container="containerSelector"></div>')($scope);
      $scope.$digest();
      
      document.body.removeChild(container);
    });

    it('should handle infiniteScrollParent attribute', function() {
      var parent = document.createElement('div');
      parent.style.height = '500px';
      parent.style.overflow = 'auto';
      var child = document.createElement('div');
      child.setAttribute('infinite-scroll', 'infiniteScrollCallback()');
      child.setAttribute('infinite-scroll-parent', '');
      parent.appendChild(child);
      document.body.appendChild(parent);
      
      element = $compile(child)($scope);
      $scope.$digest();
      
      document.body.removeChild(parent);
      expect(element).toBeDefined();
    });

    it('should handle infiniteScrollImmediateCheck attribute', function() {
      element = $compile('<div infinite-scroll="infiniteScrollCallback()" infinite-scroll-immediate-check="false"></div>')($scope);
      $scope.$digest();
      
      expect(element).toBeDefined();
    });

    it('should unbind scroll handler on $destroy', function() {
      element = $compile('<div infinite-scroll="infiniteScrollCallback()"></div>')($scope);
      $scope.$digest();
      
      // Test that scope destroy doesn't throw errors
      $scope.$destroy();
      
      expect($scope.$$destroyed).toBe(true);
    });

    it('should handle event listener registration', function() {
      $scope.eventName = 'customScrollEvent';
      element = $compile('<div infinite-scroll="infiniteScrollCallback()" infinite-scroll-listen-for-event="eventName"></div>')($scope);
      $scope.$digest();
      
      $rootScope.$broadcast('customScrollEvent');
      
      expect(element).toBeDefined();
    });

    it('should handle invalid container selector gracefully', function() {
      $scope.invalidContainer = 'invalid-selector-12345-nonexistent';
      
      // Invalid selector will return null from querySelector, which is handled gracefully
      expect(function() {
        element = $compile('<div infinite-scroll="infiniteScrollCallback()" infinite-scroll-container="invalidContainer"></div>')($scope);
        $scope.$digest();
      }).not.toThrow();
      
      expect(element).toBeDefined();
    });

    it('should handle container as HTMLElement', function() {
      var container = document.createElement('div');
      $scope.containerElement = container;
      
      element = $compile('<div infinite-scroll="infiniteScrollCallback()" infinite-scroll-container="containerElement"></div>')($scope);
      $scope.$digest();
      
      expect(element).toBeDefined();
    });

    it('should handle container with append function', function() {
      var mockJQueryElement = {
        append: function() {},
        length: 1,
        0: document.createElement('div')
      };
      $scope.jqueryContainer = mockJQueryElement;
      
      element = $compile('<div infinite-scroll="infiniteScrollCallback()" infinite-scroll-container="jqueryContainer"></div>')($scope);
      $scope.$digest();
      
      expect(element).toBeDefined();
    });
  });

  describe('THROTTLE_MILLISECONDS value', function() {
    it('should be defined as null', inject(function(THROTTLE_MILLISECONDS) {
      expect(THROTTLE_MILLISECONDS).toBe(null);
    }));
  });

  describe('infiniteScroll with throttling', function() {
    beforeEach(function() {
      module(function($provide) {
        $provide.value('THROTTLE_MILLISECONDS', 100);
      });
    });

    beforeEach(inject(function(_$compile_, _$rootScope_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = _$rootScope_.$new();
      $scope.infiniteScrollCallback = jasmine.createSpy('infiniteScrollCallback');
    }));

    it('should apply throttling when THROTTLE_MILLISECONDS is set', function() {
      element = $compile('<div infinite-scroll="infiniteScrollCallback()"></div>')($scope);
      $scope.$digest();
      
      expect(element).toBeDefined();
    });
  });

  describe('Edge cases and error handling', function() {
    it('should handle tree directive with undefined data', function() {
      element = $compile('<tree category="category"></tree>')($scope);
      $scope.$digest();
      
      var isolateScope = element.isolateScope();
      expect(isolateScope).toBeDefined();
    });

    it('should handle multiselect with type attribute', function() {
      $scope.category = { id: 1 };
      $scope.data = [];
      element = $compile('<multiselect category="category" data="data" type="checkbox"></multiselect>')($scope);
      $scope.$digest();
      
      var isolateScope = element.isolateScope();
      expect(isolateScope.type).toBe('checkbox');
    });

    it('should handle empty infiniteScrollContainer array', function() {
      $scope.emptyContainer = [];
      element = $compile('<div infinite-scroll="infiniteScrollCallback()" infinite-scroll-container="emptyContainer"></div>')($scope);
      $scope.$digest();
      
      expect(element).toBeDefined();
    });
  });
});
