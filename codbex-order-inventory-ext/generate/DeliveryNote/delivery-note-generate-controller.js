const app = angular.module('templateApp', ['ideUI', 'ideView']);

app.controller('templateController', [
    '$scope', '$http', 'ViewParameters', 'messageHub',
    function ($scope, $http, ViewParameters, messageHub) {
        const params = ViewParameters.get();
        $scope.showDialog = true;

        const salesOrderDataUrl = `/services/ts/codbex-order-inventory-ext/generate/DeliveryNote/api/DeliveryNoteGenerateService.ts/salesOrderData/${params.id}`;
        const salesOrderItemsUrl = `/services/ts/codbex-order-inventory-ext/generate/DeliveryNote/api/DeliveryNoteGenerateService.ts/salesOrderItemsData/${params.id}`;
        const catalogueUrl = "/services/ts/codbex-order-inventory-ext/generate/DeliveryNote/api/DeliveryNoteGenerateService.ts/catalogueData/";
        const catalogueSetUrl = "/services/ts/codbex-order-inventory-ext/generate/DeliveryNote/api/DeliveryNoteGenerateService.ts/catalogueSet/";

        $http.get(salesOrderDataUrl)
            .then(function (response) {
                $scope.SalesOrderData = response.data;
            });

        $http.get(salesOrderItemsUrl)
            .then(function (response) {
                $scope.SalesOrderItemsData = response.data.ItemsToDeliver;
            });

        $http.get(catalogueUrl + $scope.SalesOrderData.Store)
            .then(function (response) {
                $scope.CatalogueData = response.data.CatalogueData;
            });

        // $http.get(catalogueSetUrl + catalogueId)
        //     .then(function (response) {
        //         $scope.CatalogueSetData = response.data.CatalogueSetRecords;
        //     });

        $scope.processOrderItems = function () {
            $scope.ItemsToDeliver = [];

            $scope.SalesOrderItemsData.forEach(item => {
                // Find catalogue records for the item's product
                const catalogueRecords = $scope.CatalogueData.filter(record => record.Product === item.Product);

                if (catalogueRecords && catalogueRecords.length > 0) {
                    const catalogueRecord = catalogueRecords[0]; // Use the first matching catalogue record

                    // Fetch catalogue sets for the selected catalogue record
                    $http.get(catalogueSetUrl + catalogueRecord.Id)
                        .then(function (response) {
                            const catalogueSets = response.data.CatalogueSetRecords.sort((a, b) => b.Ratio - a.Ratio);

                            // Calculate quantities by set
                            const quantitiesBySet = calculateProductSets(item.Quantity, catalogueSets);

                            // Add processed item to ItemsToDeliver
                            $scope.ItemsToDeliver.push({
                                ...item,
                                Availability: catalogueRecord.Quantity > 0 ? catalogueRecord.Quantity : 'Unavailable',
                                QuantitiesBySet: quantitiesBySet
                            });
                        })
                        .catch(function (error) {
                            console.error(`Error fetching catalogue sets for CatalogueRecord ID: ${catalogueRecord.Id}`, error);
                        });
                } else {
                    console.warn(`No catalogue record found for product ID: ${item.Product}`);
                }
            });

            if ($scope.ItemsToDeliver.length === 0) {
                console.warn("No deliverable items found.");
            }
        };

        function calculateProductSets(totalQuantity, catalogueSets) {
            const quantitiesBySet = [];
            let remainingQuantity = totalQuantity;

            // Iterate over catalogue sets to calculate quantities
            catalogueSets.forEach(set => {
                const availableQuantity = set.Quantity || 0;

                // Calculate how many sets can be used
                const neededCount = Math.floor(remainingQuantity / set.Ratio);
                const countToUse = Math.min(neededCount, availableQuantity);

                if (countToUse > 0) {
                    quantitiesBySet.push({
                        SetName: set.Name,
                        Count: countToUse
                    });

                    remainingQuantity -= countToUse * set.Ratio;
                }
            });

            // Handle remaining quantity in base units
            if (remainingQuantity > 0) {
                quantitiesBySet.push({
                    SetName: 'BaseUnit',
                    Count: remainingQuantity
                });
            }

            return quantitiesBySet;
        }

        $scope.closeDialog = function () {
            $scope.showDialog = false;
            messageHub.closeDialogWindow("delivery-note-generate");
        };

        document.getElementById("dialog").style.display = "block";

        // Initialize data on controller load
        $scope.initializeData();
    }
]);
