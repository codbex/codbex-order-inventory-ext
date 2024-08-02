const app = angular.module('templateApp', ['ideUI', 'ideView']);

app.controller('templateController', ['$scope', '$http', 'ViewParameters', 'messageHub', function ($scope, $http, ViewParameters, messageHub) {
    const params = ViewParameters.get();
    $scope.showDialog = true;

    const salesOrderDataUrl = "/services/ts/codbex-order-inventory-ext/generate/GoodsIssue/api/GenerateGoodsIssueService.ts/salesOrderData/" + params.id;
    const salesOrderItemsDataUrl = "/services/ts/codbex-order-inventory-ext/generate/GoodsIssue/api/GenerateGoodsIssueService.ts/salesOrderItemsData/" + params.id;
    const catalogueUrl = "/services/ts/codbex-order-inventory-ext/generate/GoodsIssue/api/GenerateGoodsIssueService.ts/catalogueData";
    const productUrl = "/services/ts/codbex-order-inventory-ext/generate/GoodsIssue/api/GenerateGoodsIssueService.ts/productData";
    const goodsIssueItemUrl = "/services/ts/codbex-order-inventory-ext/generate/GoodsIssue/api/GenerateGoodsIssueService.ts/goodsIssueItems";
    const goodsIssueUrl = "/services/ts/codbex-order-inventory-ext/generate/GoodsIssue/api/GenerateGoodsIssueService.ts/goodsIssue";
    const salesOrderItemsUrl = "/services/ts/codbex-order-inventory-ext/generate/GoodsIssue/api/GenerateGoodsIssueService.ts/salesOrderItems/";

    $http.get(salesOrderDataUrl)
        .then(function (response) {
            $scope.SalesOrderData = response.data;
            return $http.get(salesOrderItemsDataUrl);
        })
        .then(function (response) {
            $scope.SalesOrderItemsData = response.data.ItemsForIssue;
            return $http.get(catalogueUrl);
        })
        .then(function (response) {
            $scope.CatalogueData = response.data.CatalogueRecords.filter(record => {
                return record.Store === $scope.SalesOrderData.Store;
            });
            return $http.get(productUrl);
        })
        .then(function (response) {
            $scope.Products = response.data.Products;

            $scope.ProductsForTable = $scope.SalesOrderItemsData.map(item => {
                const product = $scope.Products.find(product => product.Id == item.Product);
                const catalogueRecord = $scope.CatalogueData.find(record => record.Product == item.Product);

                if (catalogueRecord) {
                    return {
                        ...item,
                        ProductName: product ? product.Name : 'Unknown',
                        Availability: catalogueRecord.Quantity > 0 ? catalogueRecord.Quantity : 'Unavailable'
                    };
                } else {
                    return null;
                }
            }).filter(item => item !== null);


            $scope.ProductsForTable = $scope.ProductsForTable.filter(function (item) {
                return item.SalesOrderItemStatus == 1 || item.SalesOrderItemStatus == 3;
            });

        })
        .catch(function (error) {
            console.error("Error retrieving data:", error);
        });

    $scope.generateGoodsIssue = function () {
        const itemsForIssue = $scope.ProductsForTable.filter(item => item.selected);

        if (itemsForIssue.length > 0) {
            $http.post(goodsIssueUrl, $scope.SalesOrderData)
                .then(function (response) {
                    const goodsIssueId = response.data;
                    if (!goodsIssueId) {
                        throw new Error("Goods Issue creation failed, no ID returned.");
                    }

                    const goodsIssueItems = itemsForIssue.map(orderItem => ({
                        "GoodsIssue": goodsIssueId,
                        "Product": orderItem.Product,
                        "Quantity": orderItem.Quantity,
                        "UoM": orderItem.UoM,
                        "Price": orderItem.Price,
                        "Net": orderItem.Net,
                        "VAT": orderItem.VAT,
                        "Gross": orderItem.Gross
                    }));

                    console.log("Goods Issue Items JSON:", goodsIssueItems);

                    $http.post(goodsIssueItemUrl, goodsIssueItems)
                        .then(function (response) {
                            console.log("Response status:", response.status);
                            console.log("Response data:", response.data);
                        })
                        .catch(function (error) {
                            console.error("Error status:", error.status);
                            console.error("Error data:", error.data);
                        });
                })
                .then(function () {
                    const orderItemsToUpdate = itemsForIssue.map(orderItem => ({
                        "Id": orderItem.Id,
                        "SalesOrder": orderItem.SalesOrder,
                        "Product": orderItem.Product,
                        "Quantity": orderItem.Quantity,
                        "UoM": orderItem.UoM,
                        "Price": orderItem.Price,
                        "NET": orderItem.Net,
                        "VAT": orderItem.VAT,
                        "Gross": orderItem.Gross,
                        "SalesOrderItemStatus": 2,
                        "Availability": orderItem.Availability
                    }));

                    return $http.put(salesOrderItemsUrl, orderItemsToUpdate);
                })
                .then(function () {
                    $scope.closeDialog();
                })
                .catch(function (error) {
                    console.error("Error creating GoodsIssue, GoodsIssue items, or updating SalesOrderItems:", error);
                    $scope.closeDialog();
                });
        } else {
            console.log("No items selected. GoodsIssue not created.");
            $scope.closeDialog();
        }
    };



    // Close the dialog
    $scope.closeDialog = function () {
        $scope.showDialog = false;
        messageHub.closeDialogWindow("goods-issue-generate");
    };

    // Display the dialog
    document.getElementById("dialog").style.display = "block";
}]);
