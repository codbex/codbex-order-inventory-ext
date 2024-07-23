const viewData = {
    id: 'delivery-note-generate',
    label: 'Generate Delivery Note',
    link: '/services/web/codbex-order-inventory-ext/generate/DeliveryNote/delivery-note-generate.html',
    perspective: 'SalesOrder',
    view: 'SalesOrder',
    type: 'entity',
    order: 30
};

if (typeof exports !== 'undefined') {
    exports.getDialogWindow = function () {
        return viewData;
    }
}