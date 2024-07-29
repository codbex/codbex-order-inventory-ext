const app = angular.module('templateApp', ['ideUI', 'ideView']);
app.controller('templateController', ['$scope', '$http', 'ViewParameters', 'messageHub', function ($scope, $http, ViewParameters, messageHub) {
    const params = ViewParameters.get();
    $scope.showDialog = true;

    const salesOrderDataUrl = "/services/ts/codbex-order-inventory-ext/generate/GoodsIssue/api/GenerateGoodsIssueService.ts/salesOrderData/" + params.id;
    $http.get(salesOrderDataUrl)
        .then(function (response) {
            $scope.SalesOrderData = response.data;
        })
        .catch(function (error) {
            console.error("Error retrieving sales order data:", error);
        });

    const salesOrderItemsUrl = "/services/ts/codbex-order-inventory-ext/generate/GoodsIssue/api/GenerateGoodsIssueService.ts/salesOrderItemsData/" + params.id;
    $http.get(salesOrderItemsUrl)
        .then(function (response) {
            $scope.SalesOrderItemsData = response.data.ItemsToRestock.filter(item => item.Availability >= item.Quantity);
        })
        .catch(function (error) {
            console.error("Error retrieving sales order items data:", error);
        });

    $scope.generateGoodsIssue = function () {
        const itemsForIssue = $scope.SalesOrderItemsData.filter(item => item.selected);

        if (itemsForIssue.length > 0) {
            const goodsIssueUrl = "/services/ts/codbex-inventory/gen/codbex-inventory/api/GoodsIssues/GoodsIssueService.ts/";

            $http.post(goodsIssueUrl, $scope.SalesOrderData)
                .then(function (response) {
                    $scope.GoodsIssue = response.data;

                    itemsForIssue.forEach(orderItem => {
                        const goodsIssueItem = {
                            "GoodsIssue": $scope.GoodsIssue.Id,
                            "Product": orderItem.Product,
                            "ProductName": orderItem.ProductName,
                            "Quantity": orderItem.Quantity,
                            "UoM": orderItem.UoM,
                            "Price": orderItem.Price,
                            "Net": orderItem.Net,
                            "VAT": orderItem.VAT,
                            "Gross": orderItem.Gross
                        };
                        const goodsIssueItemUrl = "/services/ts/codbex-inventory/gen/codbex-inventory/api/GoodsIssues/GoodsIssueItemService.ts/";
                        $http.post(goodsIssueItemUrl, goodsIssueItem);
                    });

                    console.log("GoodsIssue created successfully:", response.data);
                    $scope.closeDialog();
                })
                .catch(function (error) {
                    console.error("Error creating GoodsIssue:", error);
                    $scope.closeDialog();
                });
        } else {
            console.log("No items selected. GoodsIssue not created.");
            $scope.closeDialog();
        }
    };

    $scope.closeDialog = function () {
        $scope.showDialog = false;
        messageHub.closeDialogWindow("goods-issue-generate");
    };

    document.getElementById("dialog").style.display = "block";
}]);
