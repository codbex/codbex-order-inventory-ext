const app = angular.module('templateApp', []);
app.controller('templateContoller', ['$scope', '$http', 'ViewParameters', function ($scope, $http, ViewParameters) {
    const params = ViewParameters.get();
    $scope.showDialog = true;


    const purchaseOrderDataUrl = "/services/ts/codbex-order-inventory-ext/generate/GoodsReceipt/api/GenerateGoodsReceiptService.ts/purchaseOrderData/" + params.id;
    $http.get(purchaseOrderDataUrl)
        .then(function (response) {
            $scope.PurchaseOrderData = response.data;
        });

    const purchaseOrderItemsUrl = "/services/ts/codbex-order-inventory-ext/generate/GoodsReceipt/api/GenerateGoodsReceiptService.ts/purchaseOrderItemsData/" + params.id;
    $http.get(purchaseOrderItemsUrl)
        .then(function (response) {
            $scope.PurchaseOrderItemsData = response.data;
        });

    $scope.generateGoodsReceipt = function () {
        const goodsReceiptUrl = "/services/ts/codbex-inventory/gen/api/GoodsReceipts/GoodsReceiptService.ts/";
        const entity = {
            "Date": $scope.PurchaseOrderData.Date,
            "Net": $scope.PurchaseOrderData.Net,
            "Company": $scope.PurchaseOrderData.Company,
            "Currency": $scope.PurchaseOrderData.Currency,
            "Gross": $scope.PurchaseOrderData.Gross,
            "VAT": $scope.PurchaseOrderData.VAT,
            "Reference": $scope.PurchaseOrderData.UUID
        };

        $http.post(goodsReceiptUrl, entity)
            .then(function (response) {
                $scope.GoodsReceipt = response.data

                if (!angular.equals($scope.OrderItems, {})) {
                    $scope.PurchaseOrderItemsData.forEach(orderItem => {
                        const goodsReceiptItem = {
                            "GoodsReceipt": $scope.GoodsReceipt.Id,
                            "Product": orderItem.Product,
                            "Quantity": orderItem.Quantity,
                            "UoM": orderItem.UoM,
                            "Price": orderItem.Price,
                            "Net": orderItem.Net,
                            "VAT": orderItem.VAT,
                            "Gross": orderItem.Gross
                        };
                        const goodsReceiptItemUrl = "/services/ts/codbex-inventory/gen/api/GoodsReceipts/GoodsReceiptItemService.ts/"
                        $http.post(goodsReceiptItemUrl, goodsReceiptItem)
                    });
                }

                console.log("GoodsReceipt created successfully:", response.data);
                //alert("GoodsReceipt created successfully");
            })
            .catch(function (error) {
                console.error("Error creating GoodsReceipt:", error);
                //alert("Error creating purchase GoodsReceipt: ");
            });

        $scope.closeDialog();
    };

    $scope.closeDialog = function () {
        $scope.showDialog = false;
    };

    // Display the dialog when the page loads
    document.getElementById("dialog").style.display = "block";
}]);