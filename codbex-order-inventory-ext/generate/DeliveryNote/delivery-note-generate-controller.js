const app = angular.module('templateApp', ['ideUI', 'ideView']);

app.controller('templateController', ['$scope', '$http', 'ViewParameters', 'messageHub', function ($scope, $http, ViewParameters, messageHub) {
    const params = ViewParameters.get();
    $scope.showDialog = true;

    const salesOrderDataUrl = `/services/ts/codbex-order-inventory-ext/generate/DeliveryNote/api/DeliveryNoteGenerateService.ts/salesOrderData/${params.id}`;
    const salesOrderItemsUrl = `/services/ts/codbex-order-inventory-ext/generate/DeliveryNote/api/DeliveryNoteGenerateService.ts/salesOrderItemsData/${params.id}`;
    const productsUrl = "/services/ts/codbex-order-inventory-ext/generate/DeliveryNote/api/DeliveryNoteGenerateService.ts/productData";
    const catalogueUrl = "/services/ts/codbex-order-inventory-ext/generate/DeliveryNote/api/DeliveryNoteGenerateService.ts/catalogueData";
    const deliveryNoteUrl = "/services/ts/codbex-order-inventory-ext/generate/DeliveryNote/api/DeliveryNoteGenerateService.ts/deliveryNote";
    const deliveryNoteItemUrl = "/services/ts/codbex-order-inventory-ext/generate/DeliveryNote/api/DeliveryNoteGenerateService.ts/deliveryNoteItems";
    const updateSalesOrderItemUrl = "/services/ts/codbex-order-inventory-ext/generate/DeliveryNote/api/DeliveryNoteGenerateService.ts/salesOrderItems";

    $http.get(salesOrderDataUrl)
        .then(function (response) {
            $scope.SalesOrderData = response.data;
            return $http.get(salesOrderItemsUrl);
        })
        .then(function (response) {
            $scope.SalesOrderItemsData = response.data.ItemsToDeliver;
            return $http.get(catalogueUrl);
        })
        .then(function (response) {
            $scope.CatalogueData = response.data.CatalogueRecords.filter(record => {
                return record.Store === $scope.SalesOrderData.Store;
            });
            return $http.get(productsUrl);
        })
        .then(function (response) {

            $scope.Products = response.data.Products;

            $scope.ItemsToDeliver = $scope.SalesOrderItemsData.map(item => {

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

        })
        .catch(function (error) {
            console.error("Error retrieving data:", error);
        });

    $scope.generateDeliveryNote = function () {
        const itemsToDeliver = $scope.ItemsToDeliver.filter(item => item.selected);

        if (itemsToDeliver.length > 0) {
            const deliveryNoteData = {
                "Date": new Date(),
                "Store": $scope.SalesOrderData.Store,
                "Employee": $scope.SalesOrderData.Operator,
                "Customer": $scope.SalesOrderData.Customer,
                "Company": $scope.SalesOrderData.Company
            };

            $http.post(deliveryNoteUrl, deliveryNoteData)
                .then(function (response) {
                    const deliveryNoteId = response.data;
                    if (!deliveryNoteId) {
                        throw new Error("Delivery Note creation failed, no ID returned.");
                    }

                    const deliveryNoteItems = itemsToDeliver.map(orderItem => {

                        return {
                            "DeliveryNote": deliveryNoteId,
                            "Product": orderItem.Product,
                            "Quantity": orderItem.Quantity,
                            "UoM": orderItem.UoM
                        };
                    });

                    return $http.post(deliveryNoteItemUrl, deliveryNoteItems);
                })
                .then(function () {

                    const orderItemsToUpdate = itemsToDeliver.map(orderItem => {
                        return {
                            "Id": orderItem.Id,
                            "SalesOrder": orderItem.SalesOrder,
                            "Product": orderItem.Product,
                            "Quantity": orderItem.Quantity,
                            "UoM": orderItem.UoM,
                            "Price": orderItem.Price,
                            "NET": orderItem.Net,
                            "VAT": orderItem.VAT,
                            "Gross": orderItem.Gross,
                            "SalesOrderItemStatus": 4,
                        };
                    });

                    return $http.put(updateSalesOrderItemUrl, orderItemsToUpdate);
                })
                .then(function (response) {
                    $scope.closeDialog();
                })
                .catch(function (error) {
                    console.error("Error creating DeliveryNote, DeliveryNote items, or updating SalesOrderItems:", error);
                    $scope.closeDialog();
                });
        } else {
            console.log("No items selected. Delivery Note not created.");
            $scope.closeDialog();
        }
    };

    $scope.closeDialog = function () {
        $scope.showDialog = false;
        messageHub.closeDialogWindow("delivery-note-generate");
    };

    document.getElementById("dialog").style.display = "block";
}]);
