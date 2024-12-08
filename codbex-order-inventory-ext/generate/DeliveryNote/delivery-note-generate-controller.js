const app = angular.module('templateApp', ['ideUI', 'ideView']);

app.controller('templateController', [
    '$scope', '$http', 'ViewParameters', 'messageHub',
    function ($scope, $http, ViewParameters, messageHub) {
        const params = ViewParameters.get();
        $scope.showDialog = true;

        const salesOrderDataUrl = "/services/ts/codbex-order-inventory-ext/generate/DeliveryNote/api/DeliveryNoteGenerateService.ts/salesOrderData/" + params.id;
        const salesOrderItemsUrl = "/services/ts/codbex-order-inventory-ext/generate/DeliveryNote/api/DeliveryNoteGenerateService.ts/salesOrderItemsData/" + params.id;
        const productSetUrl = "/services/ts/codbex-order-inventory-ext/generate/DeliveryNote/api/DeliveryNoteGenerateService.ts/productSetData/";
        const deliveryNoteUrl = "/services/ts/codbex-inventory/gen/codbex-inventory/api/DeliveryNote/DeliveryNoteService.ts/";
        const deliveryNoteItemUrl = "/services/ts/codbex-inventory/gen/codbex-inventory/api/DeliveryNote/DeliveryNoteItemService.ts/";
        const updateSalesOrderItemUrl = "/services/ts/codbex-order-inventory-ext/generate/DeliveryNote/api/DeliveryNoteGenerateService.ts/updateSalesOrderItem/";

        $http.get(salesOrderDataUrl).then(function (response) {
            $scope.SalesOrderData = response.data;
            $scope.StoreId = $scope.SalesOrderData.Store;
        });

        $http.get(salesOrderItemsUrl).then(function (response) {
            $scope.SalesOrderItemsData = response.data.ItemsToDeliver;
            console.log($scope.SalesOrderItemsData);

            $scope.processOrderItems().then(function (result) {
                $scope.ItemsToDeliver = result;
            });
        });

        $scope.processOrderItems = function () {
            const itemsToDeliver = [];

            const fetchPromises = $scope.SalesOrderItemsData.map(item =>
                $http.get(productSetUrl + item.Product)
                    .then(function (response) {
                        const productSets = response.data.ProductSetData;

                        console.log(`Product Sets for Product ID ${item.Product}:`, productSets);

                        if (Array.isArray(productSets) && productSets.length > 0) {
                            const sortedProductSets = productSets.sort((a, b) => b.Ratio - a.Ratio);
                            const quantitiesBySet = calculateProductSets(item, sortedProductSets);

                            itemsToDeliver.push(...quantitiesBySet);
                        } else {
                            console.warn(`No product sets available for Product ID ${item.Product}`);
                            itemsToDeliver.push(item);
                        }
                    })
                    .catch(function (error) {
                        console.error(`Error fetching product sets for Product ID ${item.Product}`, error);
                    })
            );

            return Promise.all(fetchPromises).then(() => itemsToDeliver);
        };

        function calculateProductSets(product, catalogueSets) {
            const deliveryNoteitems = [];
            let remainingQuantity = product.Quantity;

            catalogueSets.forEach(productSet => {
                if (remainingQuantity > 0) {
                    const neededCount = Math.floor(remainingQuantity / productSet.Ratio);

                    if (neededCount > 0) {
                        deliveryNoteitems.push({
                            ProductSet: productSet.Id,
                            Product: product.Id,
                            Quantity: neededCount
                        });
                        remainingQuantity -= neededCount * productSet.Ratio;
                    }
                }
            });

            return deliveryNoteitems;
        }

        $scope.generateDeliveryNote = function () {
            if ($scope.ItemsToDeliver && $scope.ItemsToDeliver.length > 0) {
                const deliveryNoteData = {
                    Date: new Date(),
                    Store: $scope.SalesOrderData.Store,
                    Employee: $scope.SalesOrderData.Operator,
                    Customer: $scope.SalesOrderData.Customer,
                    Company: $scope.SalesOrderData.Company,
                };

                $http.post(deliveryNoteUrl, deliveryNoteData)
                    .then(function (response) {
                        const deliveryNoteId = response.data.Id;
                        if (!deliveryNoteId) {
                            throw new Error("Delivery Note creation failed, no ID returned.");
                        }

                        const deliveryNoteItems = $scope.ItemsToDeliver.map(item => ({
                            DeliveryNote: deliveryNoteId,
                            Product: item.Product,
                            Quantity: item.Quantity,
                            ProductSet: item.ProductSet,
                        }));

                        deliveryNoteItems.forEach(item => {
                            $http.post(deliveryNoteItemUrl, item)
                                .then(function () {
                                    debugger
                                    const orderItemsToUpdate = $scope.SalesOrderItemsData.map(orderItem => ({
                                        Id: orderItem.Id,
                                        SalesOrder: orderItem.SalesOrder,
                                        Product: orderItem.Product,
                                        Quantity: orderItem.Quantity,
                                        UoM: orderItem.UoM,
                                        Price: orderItem.Price,
                                        NET: orderItem.Net,
                                        VATRate: orderItem.VATRate,
                                        VAT: orderItem.VAT,
                                        Gross: orderItem.Gross,
                                        SalesOrderItemStatus: 4,
                                    }));

                                    $http.put(updateSalesOrderItemUrl, orderItemsToUpdate)
                                        .then(function () {
                                            $scope.closeDialog();
                                        })
                                        .catch(function (error) {
                                            console.error(
                                                "Error creating DeliveryNote, DeliveryNote items, or updating SalesOrderItems:",
                                                error
                                            );
                                            $scope.closeDialog();
                                        });
                                })
                                .catch(function (error) {
                                    console.error("Error creating DeliveryNote items:", error);
                                });
                        });
                    })
                    .catch(function (error) {
                        console.error("Error creating DeliveryNote:", error);
                    });
            } else {
                console.warn("No items to deliver. Please ensure ItemsToDeliver is populated.");
            }
        };

        $scope.closeDialog = function () {
            $scope.showDialog = false;
            messageHub.closeDialogWindow("delivery-note-generate");
        };

        document.getElementById("dialog").style.display = "block";
    }
]);
