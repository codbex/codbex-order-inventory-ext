exports.getAction = function () {
    return {
        id: 'goods-receipt-generate',
        label: 'Generate Goods Receipt',
        perspective: 'PurchaseOrder',
        view: 'PurchaseOrder',
        type: 'entity',
        link: '/services/web/codbex-order-inventory-ext/generate/GoodsReceipt/generate-goods-receipt.html'
    }
}