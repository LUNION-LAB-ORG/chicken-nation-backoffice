import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Order, OrderType } from "../../types/order.types"

interface DayStats {
    date: string
    restaurants: {
        [restaurantName: string]: {
            app: number
            phone: number
            total: number
            delivery: number
        }
    }
}

interface TotalStats {
    app: number
    phone: number
    total: number
    delivery: number
}

function prepareDailyData(orders: Order[]): {
    dayStats: DayStats[]
    restaurantNames: string[]
    totals: { [restaurantName: string]: TotalStats }
    grandTotals: TotalStats
} {
    const daysMap = new Map<string, DayStats>()
    const restaurantNamesSet = new Set<string>()
    const totals: { [restaurantName: string]: TotalStats } = {}

    // Grouper par jour et restaurant
    orders.forEach((order) => {
        const date = new Date(order.created_at)
        const dayKey = date.toISOString().split("T")[0]
        const dayName = date.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
        })
        const restaurantName = order.restaurant?.name || "Sans restaurant"

        restaurantNamesSet.add(restaurantName)

        if (!daysMap.has(dayKey)) {
            daysMap.set(dayKey, {
                date: dayName,
                restaurants: {},
            })
        }

        const dayData = daysMap.get(dayKey)!

        if (!dayData.restaurants[restaurantName]) {
            dayData.restaurants[restaurantName] = {
                app: 0,
                phone: 0,
                total: 0,
                delivery: 0,
            }
        }

        if (!totals[restaurantName]) {
            totals[restaurantName] = {
                app: 0,
                phone: 0,
                total: 0,
                delivery: 0,
            }
        }

        const stats = dayData.restaurants[restaurantName]
        const totalStats = totals[restaurantName]

        // Compter selon le type
        if (order.auto) {
            stats.app++
            totalStats.app++
        } else {
            stats.phone++
            totalStats.phone++
        }

        stats.total++
        totalStats.total++

        if (order.type === OrderType.DELIVERY) {
            stats.delivery++
            totalStats.delivery++
        }
    })

    // Calculer les totaux généraux
    const grandTotals: TotalStats = {
        app: 0,
        phone: 0,
        total: 0,
        delivery: 0,
    }

    Object.values(totals).forEach((stats) => {
        grandTotals.app += stats.app
        grandTotals.phone += stats.phone
        grandTotals.total += stats.total
        grandTotals.delivery += stats.delivery
    })

    return {
        dayStats: Array.from(daysMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        restaurantNames: Array.from(restaurantNamesSet).sort(),
        totals,
        grandTotals,
    }
}

export async function generateOrderReport(orders: Order[]): Promise<void> {
    const { dayStats, restaurantNames, totals, grandTotals } = prepareDailyData(orders)

    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
    })

    // Titre
    doc.setFillColor(241, 121, 34) // Orange #F17922
    doc.rect(0, 0, 297, 15, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.text("Restaurants", 10, 10)

    // Préparer les données du tableau
    const tableData: any[] = []
    const columns = ["Restaurants", ...restaurantNames, "TOTAUX"]

    // Pour chaque jour
    dayStats.forEach((day) => {
        // En-tête de jour avec fond orange
        tableData.push([
            {
                content: day.date.toUpperCase(),
                colSpan: columns.length,
                styles: { fillColor: [241, 121, 34], textColor: [255, 255, 255] },
            },
        ])

        // Commandes application
        const appRow = ["Commandes application"]
        let appTotal = 0
        restaurantNames.forEach((name) => {
            const value = day.restaurants[name]?.app || 0
            appRow.push(value.toString())
            appTotal += value
        })
        appRow.push(appTotal.toString())
        tableData.push(appRow)

        // Commandes par téléphone
        const phoneRow = ["Commandes par téléphone"]
        let phoneTotal = 0
        restaurantNames.forEach((name) => {
            const value = day.restaurants[name]?.phone || 0
            phoneRow.push(value.toString())
            phoneTotal += value
        })
        phoneRow.push(phoneTotal.toString())
        tableData.push(phoneRow)

        // Total commande
        const totalRow = ["Total commande"]
        let totalCommands = 0
        restaurantNames.forEach((name) => {
            const value = day.restaurants[name]?.total || 0
            totalRow.push(value.toString())
            totalCommands += value
        })
        totalRow.push(totalCommands.toString())
        tableData.push(totalRow)

        // Livraison
        const deliveryRow = ["Livraison"]
        let deliveryTotal = 0
        restaurantNames.forEach((name) => {
            const value = day.restaurants[name]?.delivery || 0
            deliveryRow.push(value.toString())
            deliveryTotal += value
        })
        deliveryRow.push(deliveryTotal.toString())
        tableData.push(deliveryRow)
    })

    // Totaux finaux avec fond orange
    const totalAppRow = ["Total Commandes Application"]
    let totalAppSum = 0
    restaurantNames.forEach((name) => {
        const value = totals[name]?.app || 0
        totalAppRow.push(value.toString())
        totalAppSum += value
    })
    totalAppRow.push(totalAppSum.toString())

    const totalPhoneRow = ["Total Commandes par téléphone"]
    let totalPhoneSum = 0
    restaurantNames.forEach((name) => {
        const value = totals[name]?.phone || 0
        totalPhoneRow.push(value.toString())
        totalPhoneSum += value
    })
    totalPhoneRow.push(totalPhoneSum.toString())

    const totalCommandRow = ["Total commande"]
    let totalCommandSum = 0
    restaurantNames.forEach((name) => {
        const value = totals[name]?.total || 0
        totalCommandRow.push(value.toString())
        totalCommandSum += value
    })
    totalCommandRow.push(totalCommandSum.toString())

    const totalDeliveryRow = ["Total Livraison"]
    let totalDeliverySum = 0
    restaurantNames.forEach((name) => {
        const value = totals[name]?.delivery || 0
        totalDeliveryRow.push(value.toString())
        totalDeliverySum += value
    })
    totalDeliveryRow.push(totalDeliverySum.toString())

    tableData.push(totalAppRow, totalPhoneRow, totalCommandRow, totalDeliveryRow)

    // Générer le tableau
    autoTable(doc, {
        head: [columns],
        body: tableData,
        startY: 20,
        theme: "grid",
        styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: "linebreak",
        },
        headStyles: {
            fillColor: [241, 121, 34],
            textColor: [255, 255, 255],
            fontStyle: "bold",
        },
        columnStyles: {
            0: { fontStyle: "normal", fillColor: [245, 245, 245] },
        },
        didParseCell: (data) => {
            // Styler les lignes de totaux
            if (data.row.index >= tableData.length - 4 && data.section === "body") {
                data.cell.styles.fillColor = [241, 121, 34]
                data.cell.styles.textColor = [255, 255, 255]
                data.cell.styles.fontStyle = "bold"
            }
        },
    })

    // Télécharger le PDF
    const filename = `rapport_commandes_${new Date().toISOString().split("T")[0]}.pdf`
    doc.save(filename)
}
