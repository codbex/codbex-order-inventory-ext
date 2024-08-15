import { SalesOrderRepository as SalesOrderDao } from "../../../../codbex-orders/gen/codbex-orders/dao/SalesOrder/SalesOrderRepository";
import { SalesOrderItemRepository as SalesOrderItemDao } from "../../../../codbex-orders/gen/codbex-orders/dao/SalesOrder/SalesOrderItemRepository";
import { DeliveryNoteRepository as DeliveryNoteDao } from "../../../../codbex-inventory/gen/codbex-inventory/dao/DeliveryNote/DeliveryNoteRepository";
import { DeliveryNoteItemRepository as DeliveryNoteItemDao } from "../../../../codbex-inventory/gen/codbex-inventory/dao/DeliveryNote/DeliveryNoteItemRepository";
import { ProductRepository as ProductDao } from "../../../../codbex-products/gen/codbex-products/dao/Products/ProductRepository";
import { CatalogueRepository as CatalogueDao } from "../../../../codbex-products/gen/codbex-products/dao/Catalogues/CatalogueRepository";


import { Controller, Get, Put, Post, response } from "sdk/http";

@Controller
class DeliveryNoteGenerateService {

    private readonly salesOrderDao;
    private readonly salesOrderItemDao;
    private readonly deliveryNoteDao;
    private readonly deliveryNoteItemDao;
    private readonly productDao;
    private readonly catalogueDao;

    constructor() {
        this.salesOrderDao = new SalesOrderDao();
        this.salesOrderItemDao = new SalesOrderItemDao();
        this.deliveryNoteDao = new DeliveryNoteDao();
        this.deliveryNoteItemDao = new DeliveryNoteItemDao();
        this.productDao = new ProductDao();
        this.catalogueDao = new CatalogueDao();
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

    @Post("/deliveryNote")
    public addDeliveryNote(body: any, ctx: any) {
        try {
            ["Date", "Number", "Store", "Company"].forEach(elem => {
                if (!body.hasOwnProperty(elem)) {
                    response.setStatus(response.BAD_REQUEST);
                    return;
                }
            })

            const newNote = this.deliveryNoteDao.create(body);

            if (!newNote) {
                throw new Error("Failed to create DeliveryNote!");
            }

            response.setStatus(response.CREATED);
            return newNote;
        } catch (e) {
            response.setStatus(response.BAD_REQUEST);
            return { error: e.message };
        }
    }

    @Get("/catalogueData")
    public catalogueRecordsData(_: any, ctx: any) {
        try {
            let catalogueRecords = this.catalogueDao.findAll();

            if (!catalogueRecords || catalogueRecords.length === 0) {
                return {
                    error: "No catalogue records found!"
                };
            }

            return {
                CatalogueRecords: catalogueRecords
            };
        } catch (error) {
            response.setStatus(response.BAD_REQUEST);
            return "An error occurred while fetching catalogue records!";
        }
    }


    @Post("/deliveryNoteItems")
    addDeliveryNoteItems(body: any[], ctx: any) {
        try {
            const requiredFields = ["DeliveryNote", "Product", "Quantity", "UoM"];

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
                const createdItem = this.deliveryNoteItemDao.create(item);

                if (!createdItem) {
                    throw new Error("Failed to create DeliveryNoteItem!");
                }
            }

            response.setStatus(response.CREATED);
            return {
                message: "All items successfully created"
            };
        } catch (e) {
            response.setStatus(response.BAD_REQUEST);
            return {
                error: e.message
            };
        }
    }

    @Put("/salesOrderItems")
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

    @Get("/productData")
    public productsData(_: any, ctx: any) {
        try {
            let products = this.productDao.findAll();

            if (!products || products.length === 0) {
                return {
                    error: "No products found!"
                };
            }

            return {
                Products: products
            };
        } catch (error) {
            response.setStatus(response.BAD_REQUEST);
            return "An error occurred while fetching products!";
        }
    }
}
