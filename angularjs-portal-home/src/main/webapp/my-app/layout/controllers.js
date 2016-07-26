'use strict';

define(['angular', 'jquery'], function(angular, $) {

    var app = angular.module('my-app.layout.controllers', []);

    app.controller('DefaultViewController', [
      '$scope',
      '$location',
      '$localStorage',
      '$sessionStorage',
      'APP_FLAGS',
      function($scope, $location, $localStorage, $sessionStorage, APP_FLAGS){
        $scope.loading = [];
        if(!APP_FLAGS[$localStorage.layoutMode]) {
          //layout mode set weird, reset to default
          $localStorage.layoutMode = APP_FLAGS.defaultView;
        }
        $location.path('/' + $localStorage.layoutMode);
    }]);

    app.controller('LayoutController', [
        '$location',
        '$localStorage',
        '$sessionStorage',
        '$scope',
        '$rootScope',
        'layoutService',
        'miscService',
        'sharedPortletService',
        '$mdToast',
        function($location,
                 $localStorage,
                 $sessionStorage,
                 $scope,
                 $rootScope,
                 layoutService,
                 miscService,
                 sharedPortletService,
                 $mdToast) {
            this.portletType = function portletType(portlet) {
                if (portlet.staticContent != null
                    && portlet.altMaxUrl == false) {
                    return "SIMPLE";
                } else if(portlet.altMaxUrl == false && (portlet.renderOnWeb || $localStorage.webPortletRender)){
                    return "EXCLUSIVE";
                } else {
                    return "NORMAL";
                }
            };

            this.maxStaticPortlet = function gotoMaxStaticPortlet(portlet) {
                sharedPortletService.setProperty(portlet);
                $location.path('/static/'+portlet.fname);
            };

            this.directToPortlet = function directToPortlet(url) {
                $location.path(url);
            };
            this.removePortlet = function removePortletFunction(nodeId, title) {
                layoutService.removeFromHome(nodeId, title).success(function(){
                    $scope.$apply(function(request, text){
                        var result = $.grep($scope.layout, function(e) { return e.nodeId === nodeId});
                        var index = $.inArray(result[0], $scope.layout);
                        //remove
                        $scope.layout.splice(index,1);
                        $mdToast.show($mdToast.simple().textContent(title + " removed.").hideDelay(3000));
                        if($sessionStorage.marketplace != null) {
                            var marketplaceEntries = $.grep($sessionStorage.marketplace, function(e) { return e.fname === result[0].fname});
                            if(marketplaceEntries.length > 0) {
                                marketplaceEntries[0].hasInLayout = false;
                            }
                        }
                    });
                }).error(
                function(request, text, error){
                    alert('Issue deleting ' + title + ' from your list of favorites, try again later.');
                });
            };

            $scope.sortableOptions = {
                delay:250,
                cursorAt : {top: 30, left: 30},
                stop: function(e, ui) {
                    if(ui.item.sortable.dropindex != ui.item.sortable.index) {

                        var node = $scope.layout[ui.item.sortable.dropindex];
                        console.log("Change happened, logging move of " + node.fname + " from " + ui.item.sortable.index + " to " + ui.item.sortable.dropindex);
                        //index, length, movingNodeId, previousNodeId, nextNodeId
                        var prevNodeId = ui.item.sortable.dropindex != 0 ? $scope.layout[ui.item.sortable.dropindex - 1].nodeId : "";
                        var nextNodeId = ui.item.sortable.dropindex != $scope.layout.length - 1 ? $scope.layout[ui.item.sortable.dropindex + 1].nodeId : "";
                        layoutService.moveStuff(ui.item.sortable.dropindex, $scope.layout.length, node.nodeId, prevNodeId, nextNodeId);

                    }
                }
            };

            this.init = function(){
              if(typeof $rootScope.layout === 'undefined' || $rootScope.layout == null) {

                  $rootScope.layout = [];
                  $scope.layoutEmpty = false;

                  layoutService.getLayout().then(function(data){
                      $rootScope.layout = data.layout;
                      if(data.layout && data.layout.length == 0) {
                          $scope.layoutEmpty = true;
                      }
                  });
              }
            };

            this.init();

        }]);

   app.controller('BaseWidgetFunctionsController', [
     '$scope',
     '$location',
     '$sessionStorage',
     '$localStorage',
     '$mdToast',
     'sharedPortletService',
     'layoutService',
     'childController',
     function($scope,
              $location,
              $sessionStorage,
              $localStorage,
              $mdToast,
              sharedPortletService,
              layoutService,
              childController) {
       childController.portletType = function portletType(portlet) {
           if (portlet.widgetType) {
               if('option-link' === portlet.widgetType) {
                   return "OPTION_LINK";
               } else if('weather' === portlet.widgetType) {
                   return "WEATHER";
               } else if('generic' === portlet.widgetType) {
                   return "GENERIC";
               } else if('rss' === portlet.widgetType) {
                   return "RSS";
               } else if('list-of-links' === portlet.widgetType) {
				   if (portlet.widgetConfig.links.length === 1 && portlet.altMaxUrl) {
					   // If list of links has only one link and if it is the same as the portlet URL, display the
					   // normal portlet view
					   if (portlet.widgetConfig.links[0].href === portlet.url) {
						   return "NORMAL";
					   }
				   } else {
					   return "LOL";
				   }
               } else if ('search-with-links' === portlet.widgetType) {
                   return "SWL";
               } else {
                   return "WIDGET";
               }
           }else if(portlet.pithyStaticContent != null) {
               return "PITHY";
           } else if (portlet.staticContent != null
               && portlet.altMaxUrl == false) {
               return "SIMPLE";
           } else {
               return "NORMAL";
           }
       };

       childController.renderURL = function renderURL(portlet) {
         if(portlet.altMaxUrl == false && (portlet.renderOnWeb || $localStorage.webPortletRender)) {
           return 'exclusive/' + portlet.fname;
         } else {
           return portlet.url;
         }
       };

       childController.maxStaticPortlet = function gotoMaxStaticPortlet(portlet) {
           sharedPortletService.setProperty(portlet);
           $location.path('/static/'+portlet.fname);
       };

       childController.directToPortlet = function directToPortlet(url) {
           $location.path(url);
       };
       childController.removePortlet = function removePortletFunction(nodeId, title) {
           layoutService.removeFromHome(nodeId, title).success(function(){
               $scope.$apply(function(request, text){
                   var result = $.grep($scope.layout, function(e) { return e.nodeId === nodeId});
                   var index = $.inArray(result[0], $scope.layout);
                   //remove
                   $scope.layout.splice(index,1);
                   $mdToast.show($mdToast.simple().textContent(title + " removed.").hideDelay(3000));
                   if($sessionStorage.marketplace != null) {
                       var marketplaceEntries = $.grep($sessionStorage.marketplace, function(e) { return e.fname === result[0].fname});
                       if(marketplaceEntries.length > 0) {
                           marketplaceEntries[0].hasInLayout = false;
                       }
                   }
               });
           }).error(
           function(request, text, error){
               alert('Issue deleting ' + title + ' from your list of favorites, try again later.');
           });
       };
     }
   ]);


    app.controller('WidgetController', [
        '$controller',
        '$location',
        '$localStorage',
        '$sessionStorage',
        '$scope',
        '$rootScope',
        'layoutService',
        'miscService',
        'sharedPortletService',
        function($controller,
                 $location,
                 $localStorage,
                 $sessionStorage,
                 $scope,
                 $rootScope,
                 layoutService,
                 miscService,
                 sharedPortletService) {
        var base = $controller('BaseWidgetFunctionsController', { $scope : $scope, childController : this });

        function init() {
          if(typeof $rootScope.layout === 'undefined' || $rootScope.layout == null) {
            $rootScope.layout = [];
            $scope.layoutEmpty = false;
            layoutService.getLayout().then(function(data){
              $rootScope.layout = data.layout;
              if(data.layout && data.layout.length == 0) {
                  $scope.layoutEmpty = true;
              }
              });
           }
         }

          $scope.sortableOptions = {
              delay:250,
              cursorAt : {top: 30, left: 30},
              stop: function(e, ui) {
                  if(ui.item.sortable.dropindex != ui.item.sortable.index) {

                      var node = $scope.layout[ui.item.sortable.dropindex];
                      if(console) {
                        console.log("Change happened, logging move of " + node.fname + " from " + ui.item.sortable.index + " to " + ui.item.sortable.dropindex);
                      }
                      //index, length, movingNodeId, previousNodeId, nextNodeId
                      var prevNodeId = ui.item.sortable.dropindex != 0 ? $scope.layout[ui.item.sortable.dropindex - 1].nodeId : "";
                      var nextNodeId = ui.item.sortable.dropindex != $scope.layout.length - 1 ? $scope.layout[ui.item.sortable.dropindex + 1].nodeId : "";
                      layoutService.moveStuff(ui.item.sortable.dropindex, $scope.layout.length, node.nodeId, prevNodeId, nextNodeId);
                  }
              }
          };

          init();
        }]);

    app.controller('NewStuffController', ['$scope', 'layoutService', function ($scope, layoutService){
        $scope.newStuffArray = [];
        layoutService.getNewStuffFeed().then(function(result){
            $scope.newStuffArray = result;
        });

        this.show = function(stuff) {
            var date = new Date(stuff.expireYr, stuff.expireMon, stuff.expireDay);
            var today = new Date();
            return date >= today;
        }
    }]);

    app.controller('GoToAppsController', ['$location',function($location){
      this.redirectToApps = function(){$location.path("/apps");};
    }]);

    app.controller('ToggleController',[
        '$localStorage',
        '$scope',
        '$location',
        'miscService',
        'APP_FLAGS', function($localStorage,
                              $scope,
                              $location,
                              miscService,
                              APP_FLAGS){
            $scope.MODES = {
              EXPANDED : "expanded",
              COMPACT : "compact"
            }
            //scope functions
            $scope.switchMode = function(mode) {
                $localStorage.layoutMode = mode;
                $location.path('/' + mode);
                miscService.pushGAEvent('Widgets', 'View', mode);
            };

            $scope.modeIs = function(mode) {
                return $localStorage.layoutMode === mode;
            };

            //local functions
            this.init = function() {
                $scope.toggle = APP_FLAGS.enableToggle;
                $scope.$storage = localStorage;
                if($localStorage.layoutMode
                    && $location.url().indexOf($localStorage.layoutMode) == -1) {
                    //opps, we are in the wrong mode, switch!
                    if(APP_FLAGS[$localStorage.layoutMode]) { //check to make sure that mode is active
                        $location.path('/' + $localStorage.layoutMode);
                    } else {
                        console.log("Something is weird, resetting to default layout view");
                        $scope.switchMode(APP_FLAGS.defaultView);
                    }
                }
            };
            this.init();
        }
    ]);

    return app;

});
