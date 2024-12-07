const app = angular.module('templateApp', ['ideUI', 'ideView']);

app.controller('templateController', [
    '$scope', '$http', 'ViewParameters', 'messageHub',
    function ($scope, $http, ViewParameters, messageHub) {
        const params = ViewParameters.get();
        $scope.showDialog = true;

        const salesOrderDataUrl = "/services/ts/codbex-order-inventory-ext/generate/DeliveryNote/api/DeliveryNoteGenerateService.ts/salesOrderData/" + params.id;
        const salesOrderItemsUrl = "/services/ts/codbex-order-inventory-ext/generate/DeliveryNote/api/DeliveryNoteGenerateService.ts/salesOrderItemsData/" + params.id;
        const catalogueUrl = "/services/ts/codbex-order-inventory-ext/generate/DeliveryNote/api/DeliveryNoteGenerateService.ts/catalogueData/";
        const productSetUrl = "/services/ts/codbex-order-inventory-ext/generate/DeliveryNote/api/DeliveryNoteGenerateService.ts/productSetData/";
        const deliveryNoteUrl = "/services/ts/codbex-inventory/gen/codbex-inventory/api/DeliveryNote/SDeliveryNoteService.ts/";
        const deliveryNoteItemUrl = "/services/ts/codbex-inventory/gen/codbex-inventory/api/DeliveryNote/SDeliveryNoteItemService.ts/";

        $http.get(salesOrderDataUrl)
            .then(function (response) {
                $scope.SalesOrderData = response.data;
                $scope.StoreId = $scope.SalesOrderData.Store;
            });

        $http.get(salesOrderItemsUrl)
            .then(function (response) {
                $scope.SalesOrderItemsData = response.data.ItemsToDeliver;
            });

        // $http.get(catalogueUrl + $scope.StoreId)
        //     .then(function (response) {
        //         $scope.CatalogueData = response.data.CatalogueData;
        //     });

        $scope.processOrderItems = function () {
            $scope.ItemsToDeliver = [];
            const selectedItems = $scope.SalesOrderItemsData;

            selectedItems.forEach(item => {

                $http.get(productSetUrl + item.Product)
                    .then(function (response) {
                        const productSets = response.data.productSetData.sort((a, b) => b.Ratio - a.Ratio);

                        const quantitiesBySet = calculateProductSets(item, productSets);

                        quantitiesBySet.forEach(setItem => {
                            $scope.ItemsToDeliver.push(setItem);
                        });
                    })
                    .catch(function (error) {
                        console.error(`Error fetching catalogue sets for CatalogueRecord ID: ${catalogueRecord.Id}`, error);
                    });
            });

            if ($scope.SalesOrderItemsData.length === 0) {
                console.warn("No deliverable items found.");
            }
        };

        function calculateProductSets(product, catalogueSets) {
            const deliveryNoteitems = [];
            let remainingQuantity = product.Quantity;

            catalogueSets.forEach(set => {

                if (remainingQuantity > 0) {
                    const neededCount = Math.floor(remainingQuantity / set.Ratio);

                    if (countToUse > 0) {
                        deliveryNoteitems.push({
                            ProductSet: set.Name,
                            Product: product.Id,
                            Quantity: neededCount
                        });

                        remainingQuantity -= neededCount * set.Ratio;
                    }
                }
            });

            return deliveryNoteitems;
        }

        $scope.generateDeliveryNote = function () {

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

                    const deliveryNoteItems = $scope.ItemsToDeliver.map(item => {

                        return {
                            "DeliveryNote": deliveryNoteId,
                            "Product": item.Product,
                            "Quantity": item.Quantity,
                            "ProductSet": item.ProductSet
                        };
                    });

                    deliveryNoteItems.forEach(item => {
                        $http.post(deliveryNoteItemUrl, item);
                    });
                });
        }

        $scope.closeDialog = function () {
            $scope.showDialog = false;
            messageHub.closeDialogWindow("delivery-note-generate");
        };

        document.getElementById("dialog").style.display = "block";
    }
]);