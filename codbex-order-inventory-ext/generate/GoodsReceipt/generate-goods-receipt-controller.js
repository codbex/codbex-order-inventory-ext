const app = angular.module('templateApp', ['ideUI', 'ideView']);
app.controller('templateController', ['$scope', '$http', 'ViewParameters', 'messageHub', function ($scope, $http, ViewParameters, messageHub) {
    const params = ViewParameters.get();
    $scope.showDialog = true;

    const purchaseOrderDataUrl = "/services/ts/codbex-order-inventory-ext/generate/GoodsReceipt/api/GenerateGoodsReceiptService.ts/purchaseOrderData/" + params.id;
    $http.get(purchaseOrderDataUrl)
        .then(function (response) {
            $scope.PurchaseOrderData = response.data;
        })
        .catch(function (error) {
            console.error("Error retrieving purchase order data:", error);
        });

    const purchaseOrderItemsUrl = "/services/ts/codbex-order-inventory-ext/generate/GoodsReceipt/api/GenerateGoodsReceiptService.ts/purchaseOrderItemsData/" + params.id;
    $http.get(purchaseOrderItemsUrl)
        .then(function (response) {
            $scope.PurchaseOrderItemsData = response.data;
        })
        .catch(function (error) {
            console.error("Error retrieving purchase order items data:", error);
        });

    $scope.generateGoodsReceipt = function () {
        const items = $scope.PurchaseOrderItemsData;

        const goodsReceiptUrl = "/services/ts/codbex-inventory/gen/api/GoodsReceipts/GoodsReceiptService.ts/";

        $http.post(goodsReceiptUrl, $scope.PurchaseOrderData)
            .then(function (response) {
                $scope.GoodsReceipt = response.data

                if ($scope.PurchaseOrderItemsData && $scope.PurchaseOrderItemsData.length > 0) {
                    items.forEach(orderItem => {
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
                $scope.closeDialog();
            })
            .catch(function (error) {
                console.error("Error creating GoodsReceipt:", error);
                //alert("Error creating purchase GoodsReceipt: ");
                $scope.closeDialog();
            });
    };

    $scope.closeDialog = function () {
        $scope.showDialog = false;
        messageHub.closeDialogWindow("goods-receipt-generate");
    };

    document.getElementById("dialog").style.display = "block";
}]);