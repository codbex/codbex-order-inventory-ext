import { SalesOrderRepository as SalesOrderDao } from "../../../../codbex-orders/gen/codbex-orders/dao/SalesOrder/SalesOrderRepository";
import { SalesOrderItemRepository as SalesOrderItemDao } from "../../../../codbex-orders/gen/codbex-orders/dao/SalesOrder/SalesOrderItemRepository";
import { CatalogueRepository as CatalogueDao } from "../../../../codbex-products/gen/codbex-products/dao/Catalogues/CatalogueRepository";
import { ProductSetRepository as ProductSetDao } from "../../../../codbex-products/gen/codbex-products/dao/Products/ProductSetRepository";

import { Controller, Get, Put, Post, response } from "sdk/http";

@Controller
class DeliveryNoteGenerateService {

    private readonly salesOrderDao;
    private readonly salesOrderItemDao;
    private readonly catalogueDao;
    private readonly productSetDao;


    constructor() {
        this.salesOrderDao = new SalesOrderDao();
        this.salesOrderItemDao = new SalesOrderItemDao();
        this.catalogueDao = new CatalogueDao();
        this.productSetDao = new ProductSetDao();

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
                    SalesOrderItemStatus: 2 //Status: Issued which means there is availability for this product
                }
            }
        });

        return {
            ItemsToDeliver: salesOrderItems
        };
    }

    @Get("/catalogueData/:storeId")
    public catalogueRecordsData(_: any, ctx: any) {
        const storeId = ctx.pathParameters.storeId;

        let catalogueRecords = this.catalogueDao.findAll({
            $filter: {
                equals: {
                    Store: storeId
                }
            }
        });

        return {
            CatalogueData: catalogueRecords
        }
    }

    @Get("/productSetData/:productId")
    public productSetRecordsData(_: any, ctx: any) {
        const productId = ctx.pathParameters.productId;

        let productSetRecords = this.productSetDao.findAll({
            $filter: {
                equals: {
                    Product: productId
                }
            }
        });

        return {
            ProductSetData: productSetRecords
        }
    }

    @Put("/updateSalesOrderItem")
    updateSalesOrderItems(body: any[], ctx: any) {
        try {
            const requiredFields = [
                "Id",
                "SalesOrder",
                "Product",
                "Quantity",
                "UoM",
                "Price",
                "NET",
                "VATRate",
                "VAT",
                "Gross",
                "SalesOrderItemStatus",
            ];

            if (!Array.isArray(body)) {
                response.setStatus(response.BAD_REQUEST);
                return {
                    error: "Request body must be an array of items"
                };
            }

            for (const item of body) {
                for (const field of requiredFields) {
                    if (!item.hasOwnProperty(field)) {
                        response.setStatus(response.BAD_REQUEST);
                        return {
                            error: `Missing required field in item: ${field}`
                        };
                    }
                }

                this.salesOrderItemDao.update(item);

            }

            response.setStatus(response.OK);
            return {
                message: "All items successfully updated"
            };
        } catch (e) {
            response.setStatus(response.BAD_REQUEST);
            return {
                error: e.message
            };
        }
    }
}