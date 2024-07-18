const app = angular.module('templateApp', ['ideUI', 'ideView']);
app.controller('templateController', ['$scope', '$http', 'ViewParameters', 'messageHub', function ($scope, $http, ViewParameters, messageHub) {
    const params = ViewParameters.get();
    $scope.showDialog = true;

    const salesOrderDataUrl = "/services/ts/codbex-order-inventory-ext/generate/DeliveryNote/api/DeliveryNoteGenerateService.ts/salesOrderData/" + params.id;
    $http.get(salesOrderDataUrl)
        .then(function (response) {
            $scope.SalesOrderData = response.data;
        })
        .catch(function (error) {
            console.error("Error retrieving sales order data:", error);
        });

    const salesOrderItemsUrl = "/services/ts/codbex-order-inventory-ext/generate/DeliveryNote/api/DeliveryNoteGenerateService.ts/salesOrderItemsData/" + params.id;
    $http.get(salesOrderItemsUrl)
        .then(function (response) {
            $scope.SalesOrderItemsData = response.data.ItemsToDeliver;
            $scope.ItemsToRestock = response.data.ItemsToRestock;
        })
        .catch(function (error) {
            console.error("Error retrieving sales order items data:", error);
        });

    $scope.generateDeliveryNote = function () {
        const itemsToDeliver = $scope.SalesOrderItemsData;

        const deliveryNoteUrl = "/services/ts/codbex-inventory/gen/codbex-inventory/api/DeliveryNote/DeliveryNoteService.ts/";

        const deliveryNoteData = {
            "Date": new Date(),
            "Store": $scope.SalesOrderData.Store,
            "Employee": $scope.SalesOrderData.Operator,
            "Customer": $scope.SalesOrderData.Customer,
            "Number": $scope.SalesOrderData.Reference
        };

        console.log("DeliveryNoteData:", deliveryNoteData);

        $http.post(deliveryNoteUrl, deliveryNoteData)
            .then(function (response) {
                $scope.DeliveryNote = response.data;

                itemsToDeliver.forEach(orderItem => {
                    const deliveryNoteItem = {
                        "DeliveryNote": $scope.DeliveryNote.DELIVERYNOTE_ID,
                        "Product": orderItem.Product,
                        "Quantity": orderItem.Quantity,
                        "UoM": orderItem.UoM,
                        "Price": orderItem.Price,
                        "Net": orderItem.Net,
                        "VAT": orderItem.VAT,
                        "Gross": orderItem.Gross
                    };
                    const deliveryNoteItemUrl = "/services/ts/codbex-inventory/gen/codbex-inventory/api/DeliveryNote/DeliveryNoteItemService.ts/";
                    $http.post(deliveryNoteItemUrl, deliveryNoteItem);

                    orderItem.SalesOrderItemStatus = 4;
                    const updateSalesOrderItemUrl = "/services/ts/codbex-orders/gen/codbex-orders/api/SalesOrder/SalesOrderItemService.ts/" + orderItem.Id;
                    $http.put(updateSalesOrderItemUrl, orderItem);
                });

                console.log("DeliveryNote created successfully:", response.data);
                $scope.closeDialog();
            })
            .catch(function (error) {
                console.error("Error creating DeliveryNote:", error.response.data.message);
                $scope.closeDialog();
            });
    };

    $scope.closeDialog = function () {
        $scope.showDialog = false;
        messageHub.closeDialogWindow("delivery-note-generate");
    };

    document.getElementById("dialog").style.display = "block";
}]);
