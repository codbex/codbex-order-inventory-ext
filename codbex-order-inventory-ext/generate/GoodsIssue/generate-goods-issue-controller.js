const app = angular.module('templateApp', ['ideUI', 'ideView']);
app.controller('templateController', ['$scope', '$http', 'ViewParameters', 'messageHub', function ($scope, $http, ViewParameters, messageHub) {
    const params = ViewParameters.get();
    $scope.showDialog = true;

    const salesOrderDataUrl = "/services/ts/codbex-order-inventory-ext/generate/GoodsIssue/api/GenerateGoodsIssueService.ts/salesOrderData/" + params.id;
    const salesOrderItemsUrl = "/services/ts/codbex-order-inventory-ext/generate/GoodsIssue/api/GenerateGoodsIssueService.ts/salesOrderItemsData/" + params.id;
    const catalogueUrl = "/services/ts/codbex-order-inventory-ext/generate/GoodsIssue/api/GenerateGoodsIssueService.ts/catalogueData";

    // First, retrieve the sales order data
    $http.get(salesOrderDataUrl)
        .then(function (response) {
            $scope.SalesOrderData = response.data;

            // After retrieving sales order data, retrieve sales order items data
            return $http.get(salesOrderItemsUrl);
        })
        .then(function (response) {
            $scope.SalesOrderItemsData = response.data.ItemsForIssue;

            // After retrieving sales order items data, retrieve catalogue data
            return $http.get(catalogueUrl);
        })
        .then(function (response) {
            $scope.CatalogueData = response.data.CatalogueRecords.filter(record => {
                return record.Store == $scope.SalesOrderData.Store;
            });

            console.log("Catalogue record:", $scope.CatalogueData);
        })
        .catch(function (error) {
            console.error("Error retrieving data:", error);
        });

    $scope.generateGoodsIssue = function () {
        const itemsForIssue = $scope.SalesOrderItemsData.filter(item => item.selected);

        if (itemsForIssue.length > 0) {
            const goodsIssueUrl = "/services/ts/codbex-inventory/gen/codbex-inventory/api/GoodsIssues/GoodsIssueService.ts/";

            $http.post(goodsIssueUrl, $scope.SalesOrderData)
                .then(function (response) {
                    $scope.GoodsIssue = response.data;

                    const goodsIssueItemUrl = "/services/ts/codbex-inventory/gen/codbex-inventory/api/GoodsIssues/GoodsIssueItemService.ts/";

                    const postPromises = itemsForIssue.map(orderItem => {
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
                        return $http.post(goodsIssueItemUrl, goodsIssueItem);
                    });

                    Promise.all(postPromises)
                        .then(function (responses) {
                            console.log("All GoodsIssue items created successfully:", responses);
                            $scope.closeDialog();
                        })
                        .catch(function (error) {
                            console.error("Error creating GoodsIssue items:", error);
                            $scope.closeDialog();
                        });
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