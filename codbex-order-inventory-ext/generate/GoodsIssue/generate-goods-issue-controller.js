const app = angular.module('templateApp', []);
app.controller('templateContoller', function ($scope, $http) {
    let url_string = (window.location.href).toLowerCase();
    let url = new URL(url_string);
    let id = url.searchParams.get("id");
    $scope.showDialog = true;

    const salesOrderDataUrl = "/services/ts/codbex-order-inventory-ext/generate/GoodsIssue/api/GenerateGoodsIssueService.ts/salesOrderData/" + id;
    $http.get(salesOrderDataUrl)
        .then(function (response) {
            $scope.SalesOrderData = response.data;
        });

    const salesOrderItemsUrl = "/services/ts/codbex-order-inventory-ext/generate/GoodsIssue/api/GenerateGoodsIssueService.ts/salesOrderItemsData/" + id;
    $http.get(salesOrderItemsUrl)
        .then(function (response) {
            $scope.SalesOrderItemsData = response.data;
        });

    $scope.generateGoodsIssue = function () {
        const goodsIssueUrl = "/services/ts/codbex-inventory/gen/api/GoodsIssues/GoodsIssueService.ts/";
        const entity = {
            "Date": $scope.SalesOrderData.Date,
            "Net": $scope.SalesOrderData.Net,
            "Company": $scope.SalesOrderData.Company,
            "Currency": $scope.SalesOrderData.Currency,
            "Gross": $scope.SalesOrderData.Gross,
            "VAT": $scope.SalesOrderData.VAT,
            "Reference": $scope.SalesOrderData.UUID
        };

        $http.post(goodsIssueUrl, entity)
            .then(function (response) {
                $scope.GoodsIssue = response.data

                if (!angular.equals($scope.OrderItems, {})) {
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
                        const goodsIssueItemUrl = "/services/ts/codbex-inventory/gen/api/GoodsIssues/GoodsIssueItemService.ts/"
                        $http.post(goodsIssueItemUrl, goodsIssueItem)
                    });
                }

                console.log("GoodsIssue created successfully:", response.data);
                //alert("GoodsIssue created successfully");
            })
            .catch(function (error) {
                console.error("Error creating GoodsIssue:", error);
                //alert("Error creating sales GoodsIssue: ");
            });

        $scope.closeDialog();
    };

    $scope.closeDialog = function () {
        $scope.showDialog = false;
    };

    // Display the dialog when the page loads
    document.getElementById("dialog").style.display = "block";
});