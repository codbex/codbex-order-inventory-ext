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
            $scope.ItemsToDeliver = response.data.ItemsToDeliver;
        })
        .catch(function (error) {
            console.error("Error retrieving sales order items data:", error);
        });

    $scope.generateDeliveryNote = function () {
        const itemsToDeliver = $scope.ItemsToDeliver;

        const deliveryNoteUrl = "/services/ts/codbex-inventory/gen/codbex-inventory/api/DeliveryNote/DeliveryNoteService.ts/";

        const deliveryNoteData = {
            "Date": new Date(),
            "Store": $scope.SalesOrderData.Store,
            "Employee": $scope.SalesOrderData.Operator,
            "Customer": $scope.SalesOrderData.Customer,
            "Company": $scope.SalesOrderData.Company
        };

        $http.post(deliveryNoteUrl, deliveryNoteData)
            .then(function (response) {
                $scope.DeliveryNote = response.data;

                const requests = itemsToDeliver.map(orderItem => {
                    const deliveryNoteItem = {
                        "Quantity": orderItem.Quantity,
                        "UoM": orderItem.UoM,
                        "Product": orderItem.Product,
                        "DeliveryNote": $scope.DeliveryNote.Id
                    };

                    const deliveryNoteItemUrl = "/services/ts/codbex-inventory/gen/codbex-inventory/api/DeliveryNote/DeliveryNoteItemService.ts/";
                    const createDeliveryNoteItem = $http.post(deliveryNoteItemUrl, deliveryNoteItem);

                    orderItem.SalesOrderItemStatus = 4;
                    const updateSalesOrderItemUrl = "/services/ts/codbex-orders/gen/codbex-orders/api/SalesOrder/SalesOrderItemService.ts/" + orderItem.Id;
                    const updateSalesOrderItem = $http.put(updateSalesOrderItemUrl, orderItem);

                    return Promise.all([createDeliveryNoteItem, updateSalesOrderItem]);
                });

                Promise.all(requests)
                    .then(results => {
                        $scope.closeDialog();
                    })
                    .catch(error => {
                        console.error("Error creating delivery note items:", error);
                        $scope.closeDialog();
                    });
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
