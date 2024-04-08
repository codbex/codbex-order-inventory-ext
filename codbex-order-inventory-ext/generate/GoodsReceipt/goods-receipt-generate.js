const viewData = {
    id: 'goods-receipt-generate',
    label: 'Generate Goods Receipt',
    link: '/services/web/codbex-order-inventory-ext/generate/GoodsReceipt/generate-goods-receipt.html',
    perspective: 'PurchaseOrder',
    view: 'PurchaseOrder',
    type: 'entity',
    order: 20
};

if (typeof exports !== 'undefined') {
    exports.getDialogWindow = function () {
        return viewData;
    }
}