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

    const salesOrderItemsUrl = "/services/ts/codbex-order-inventory-ext/generate/DeliveryNote/api/DeliveryNoteGenerateService.ts/salesOrderData/" + params.id;
    $http.get(salesOrderItemsUrl)
        .then(function (response) {
            $scope.SalesOrderItemsData = response.data.ItemsForIssue;
            $scope.ItemsToRestock = response.data.ItemsToRestock;
        })
        .catch(function (error) {
            console.error("Error retrieving sales order items data:", error);
        });

    $scope.generateDeliveryNote = function () {
        const itemsForIssue = $scope.SalesOrderItemsData;

        if (itemsForIssue.length > 0) {
            const deliveryNoteUrl = "/services/ts/codbex-inventory/gen/codbex-inventory/api/DeliveryNote/DeliveryNoteService.ts/";

            $http.post(deliveryNoteUrl, $scope.SalesOrderData)
                .then(function (response) {
                    $scope.DeliveryNote = response.data;

                    if ($scope.SalesOrderItemsData && $scope.SalesOrderItemsData.length > 0) {
                        itemsForIssue.forEach(orderItem => {
                            const deliveryNoteItem = {
                                "DeliveryNote": $scope.DeliveryNote.Id,
                                "Product": orderItem.Product,
                                "Quantity": orderItem.Quantity,
                                "UoM": orderItem.UoM,
                            };
                            const deliveryNoteItemUrl = "/services/ts/codbex-inventory/gen/codbex-inventory/api/DeliveryNote/DeliveryNoteItemService.ts/";
                            $http.post(deliveryNoteItemUrl, deliveryNoteItem);
                        });
                    }
                    console.log("Delivery Note created successfully:", response.data);
                    $scope.closeDialog();
                })
                .catch(function (error) {
                    console.error("Error creating Delivery Note:", error);
                    $scope.closeDialog();
                });
        } else {
            console.log("No items to issue. Delivery Note not created.");
            $scope.closeDialog();
        }
    };

    $scope.closeDialog = function () {
        $scope.showDialog = false;
        messageHub.closeDialogWindow("delivery-note-generate");
    };

    document.getElementById("dialog").style.display = "block";
}]);