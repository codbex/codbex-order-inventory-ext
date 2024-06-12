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
            $scope.SalesOrderItemsData = response.data;
        })
        .catch(function (error) {
            console.error("Error retrieving sales order items data:", error);
        });

    $scope.generateGoodsIssue = function () {
        const goodsIssueUrl = "/services/ts/codbex-inventory/gen/api/GoodsIssues/GoodsIssueService.ts/";

        $http.post(goodsIssueUrl, $scope.SalesOrderData)
            .then(function (response) {
                $scope.GoodsIssue = response.data;

                if ($scope.SalesOrderItemsData && $scope.SalesOrderItemsData.length > 0) {

                    $scope.SalesOrderItemsData.forEach(orderItem => {
                        const goodsIssueItem = {
                            "GoodsIssue": $scope.GoodsIssue.Id,
                            "Product": orderItem.Product,
                            "Quantity": orderItem.Quantity,
                            "UoM": orderItem.UoM,
                            "Price": orderItem.Price,
                            "Net": orderItem.Net,
                            "VAT": orderItem.VAT,
                            "Gross": orderItem.Gross
                        };
                        const goodsIssueItemUrl = "/services/ts/codbex-inventory/gen/api/GoodsIssues/GoodsIssueItemService.ts/";
                        $http.post(goodsIssueItemUrl, goodsIssueItem);
                    });
                }
                console.log("GoodsIssue created successfully:", response.data);
                $scope.closeDialog();
            })
            .catch(function (error) {
                console.error("Error creating GoodsIssue:", error);
                $scope.closeDialog();
            });

    };

    $scope.closeDialog = function () {
        $scope.showDialog = false;
        messageHub.closeDialogWindow("goods-issue-generate");
    };

    // Display the dialog when the page loads
    document.getElementById("dialog").style.display = "block";
}]);
