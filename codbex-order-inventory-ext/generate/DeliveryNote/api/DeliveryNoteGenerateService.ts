import { SalesOrderRepository as SalesOrderDao } from "../../../../codbex-orders/gen/codbex-orders/dao/SalesOrder/SalesOrderRepository";
import { SalesOrderItemRepository as SalesOrderItemDao } from "../../../../codbex-orders/gen/codbex-orders/dao/SalesOrder/SalesOrderItemRepository";
import { DeliveryNoteRepository as DeliveryNoteDao } from "../../../../codbex-inventory/gen/codbex-inventory/dao/DeliveryNote/DeliveryNoteRepository";
import { DeliveryNoteItemRepository as DeliveryNoteItemDao } from "../../../../codbex-inventory/gen/codbex-inventory/dao/DeliveryNote/DeliveryNoteItemRepository";
import { ProductRepository as ProductDao } from "../../../../codbex-products/gen/codbex-products/dao/Products/ProductRepository";
import { CatalogueRepository as CatalogueDao } from "../../../../codbex-products/gen/codbex-products/dao/Catalogues/CatalogueRepository";
import { CatalogueSetRepository as CatalogueSetDao } from "../../../../codbex-products/gen/codbex-products/dao/Catalogues/CatalogueSetRepository"

import { Controller, Get, Put, Post, response } from "sdk/http";

@Controller
class DeliveryNoteGenerateService {

    private readonly salesOrderDao;
    private readonly salesOrderItemDao;
    private readonly deliveryNoteDao;
    private readonly deliveryNoteItemDao;
    private readonly productDao;
    private readonly catalogueDao;
    private readonly catalogueSetDao;


    constructor() {
        this.salesOrderDao = new SalesOrderDao();
        this.salesOrderItemDao = new SalesOrderItemDao();
        this.deliveryNoteDao = new DeliveryNoteDao();
        this.deliveryNoteItemDao = new DeliveryNoteItemDao();
        this.productDao = new ProductDao();
        this.catalogueDao = new CatalogueDao();
        this.catalogueSetDao = new CatalogueSetDao();

    }

    @Get("/salesOrderData/:salesOrderId")
    public salesOrderData(_: any, ctx: any) {
        const salesOrderId = ctx.pathParameters.salesOrderId;

        let salesOrder = this.salesOrderDao.findById(salesOrderId);

        return {
            "Date": salesOrder.Date,
            "Due": salesOrder.Due,
            "Customer": salesOrder.Customer,
            "Net": salesOrder.Net,
            "Currency": salesOrder.Currency,
            "Gross": salesOrder.Gross,
            "Discount": salesOrder.Discount,
            "Taxes": salesOrder.Taxes,
            "VAT": salesOrder.VAT,
            "Total": salesOrder.Total,
            "Conditions": salesOrder.Conditions,
            "SentMethod": salesOrder.SentMethod,
            "Company": salesOrder.Company,
            "SalesOrderStatus": 1,
            "Operator": salesOrder.Operator,
            "Reference": salesOrder.UUID,
            "Store": salesOrder.Store,
            "Name": salesOrder.Name
        };
    }

    @Get("/salesOrderItemsData/:salesOrderId")
    public salesOrderItemsData(_: any, ctx: any) {
        const salesOrderId = ctx.pathParameters.salesOrderId;

        let salesOrder = this.salesOrderDao.findById(salesOrderId);

        if (!salesOrder) {
            ctx.status = 404;
            ctx.body = {
                error: "Sales order not found"
            };
            return;
        }

        let salesOrderItems = this.salesOrderItemDao.findAll({
            $filter: {
                equals: {
                    SalesOrder: salesOrder.Id,
                    SalesOrderItemStatus: 2
                }
            }
        });

        return {
            ItemsToDeliver: salesOrderItems
        }
    }

    @Get("/catalogueData/:storeId")
    public catalogueRecordsData(_: any, ctx: any) {
        const productId = ctx.pathParameters.productId;
        const storeId = ctx.pathParameters.storeId;

        let catalogueRecords = this.catalogueDao.findAll({
            $filter: {
                equals: {
                    Product: productId,
                    Store: storeId
                }
            }
        });

        return {
            CatalogueData: catalogueRecords
        }
    }
}
