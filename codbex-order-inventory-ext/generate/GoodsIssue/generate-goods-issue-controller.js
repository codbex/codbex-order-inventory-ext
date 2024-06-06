const app = angular.module('templateApp', ['ideUI', 'ideView']);
app.controller('templateController', ['$scope', '$http', 'ViewParameters', 'messageHub', function ($scope, $http, ViewParameters, messageHub) {
    const params = ViewParameters.get();
    $scope.showDialog = true;

    const salesOrderDataUrl = "/services/ts/codbex-order-inventory-ext/generate/GoodsIssue/api/GenerateGoodsIssueService.ts/salesOrderData/" + params.id;
    $http.get(salesOrderDataUrl)
        .then(function (response) {
            $scope.SalesOrderData = response.data;
            console.log("Sales order data retrieved: ", $scope.SalesOrderData);
        })
        .catch(function (error) {
            console.error("Error retrieving sales order data:", error);
        });

    const salesOrderItemsUrl = "/services/ts/codbex-order-inventory-ext/generate/GoodsIssue/api/GenerateGoodsIssueService.ts/salesOrderItemsData/" + params.id;
    $http.get(salesOrderItemsUrl)
        .then(function (response) {
            $scope.SalesOrderItemsData = response.data;
            console.log("Sales order items data retrieved: ", $scope.SalesOrderItemsData);
        })
        .catch(function (error) {
            console.error("Error retrieving sales order items data:", error);
        });

    $scope.generateGoodsIssue = function () {
        const goodsIssueUrl = "/services/ts/codbex-inventory/gen/api/GoodsIssues/GoodsIssueService.ts/";

        console.log("Generating goods issue with the following sales order data:", $scope.SalesOrderData);
        $http.post(goodsIssueUrl, $scope.SalesOrderData)
            .then(function (response) {
                $scope.GoodsIssue = response.data;
                console.log("Goods issue created successfully:", $scope.GoodsIssue);

                if ($scope.SalesOrderItemsData && $scope.SalesOrderItemsData.length > 0) {
                    console.log("Transferring sales order items to the goods issue...");

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
                        console.log("Sending POST request to goodsIssueItemUrl with item:", goodsIssueItem);
                        $http.post(goodsIssueItemUrl, goodsIssueItem);
                    });
                }
                console.log("Goods Issue created successfully: ", response.data);
                $scope.closeDialog();
            })
            .catch(function (error) {
                console.error("Error creating goods issue:", error);
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
