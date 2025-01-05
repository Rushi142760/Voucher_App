document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const refNo = urlParams.get('refNo');

    if (refNo) {
        fetchVoucherDetails(refNo);
    } else {
        alert('Voucher reference number not provided.');
    }
});

function fetchVoucherDetails(refNo) {
    fetch(`http://localhost:8082/api/vouchers/${refNo}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            populateForm(data);
        })
        .catch(error => {
            console.error('Error fetching voucher details:', error);
            alert('Failed to fetch voucher details.');
        });
}




function populateForm(data) {
    document.getElementById('billRefNo').value = data.billRefNo;
    document.getElementById('date').value = data.date;
    document.getElementById('totalAmount').value = data.totalAmount;
    document.getElementById('custName').value = data.custName;

    const voucherItemsContainer = document.getElementById('voucherItems');
    voucherItemsContainer.innerHTML = `
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th>Jewelry Name</th>
                    <th>Gross Weight</th>
                    <th>Net Weight</th>
                    <th>Fine Weight</th>
                    <th>Rate</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody id="voucherTableBody">
                ${data.voucherDetails
                    .map(
                        (item, index) => `
                        <tr>
                            <td><input type="text" id="itemName${index}" class="form-control" value="${item.jewelryName}" /></td>
                            <td><input type="number" id="grossWeight${index}" class="form-control" value="${item.grossWeight}" oninput="recalculateAmount(${index})" /></td>
                            <td><input type="number" id="netWeight${index}" class="form-control" value="${item.netWeight}" oninput="recalculateAmount(${index})" /></td>
                            <td><input type="number" id="fineWeight${index}" class="form-control" value="${item.fineWeight}" oninput="recalculateAmount(${index})" /></td>
                            <td><input type="number" id="rate${index}" class="form-control" value="${item.rate}" oninput="recalculateAmount(${index})" /></td>
                            <td><input type="number" id="amount${index}" class="form-control" value="${item.amount}" readonly /></td>
                        </tr>
                    `
                    )
                    .join('')}
            </tbody>
            <tfoot>
                <tr>
                    <td>Total</td>
                    <td id="totalGrossWeight">0</td>
                    <td id="totalNetWeight">0</td>
                    <td id="totalFineWeight">0</td>
                    <td></td>
                    <td id="totalAmount">0</td>
                </tr>
            </tfoot>
        </table>
    `;

    // Call updateTotals initially to calculate the totals for the initial data
    updateTotals();
}

function recalculateAmount(index) {
    const grossWeight = parseFloat(document.getElementById(`grossWeight${index}`).value) || 0;
    const netWeight = parseFloat(document.getElementById(`netWeight${index}`).value) || 0;
    const fineWeight = parseFloat(document.getElementById(`fineWeight${index}`).value) || 0;
    const rate = parseFloat(document.getElementById(`rate${index}`).value) || 0;

    // Recalculate amount (customize this formula if needed)
    const amount = fineWeight * rate;
    document.getElementById(`amount${index}`).value = amount;  // Set the calculated amount

    // Update totals after recalculation
    updateTotals();
}

function updateTotals() {
    const rows = document.querySelectorAll("#voucherTableBody tr");
    let totalGrossWeight = 0;
    let totalNetWeight = 0;
    let totalFineWeight = 0;
    let totalAmount = 0;

    rows.forEach((row, index) => {
        const grossWeight = parseFloat(document.getElementById(`grossWeight${index}`).value) || 0;
        const netWeight = parseFloat(document.getElementById(`netWeight${index}`).value) || 0;
        const fineWeight = parseFloat(document.getElementById(`fineWeight${index}`).value) || 0;
        const amount = parseFloat(document.getElementById(`amount${index}`).value) || 0;

        totalGrossWeight += grossWeight;
        totalNetWeight += netWeight;
        totalFineWeight += fineWeight;
        totalAmount += amount;
    });

    // Update totals in the footer
    document.getElementById('totalGrossWeight').textContent = totalGrossWeight;
    document.getElementById('totalNetWeight').textContent = totalNetWeight;
    document.getElementById('totalFineWeight').textContent = totalFineWeight;
    document.getElementById('totalAmount').textContent = totalAmount;
}






function saveVoucher() {
    // Collect form data into an object
    const updatedVoucher = {
        billRefNo: document.getElementById('billRefNo').value,
        date: document.getElementById('date').value,
        totalAmount: parseFloat(document.getElementById('totalAmount').value) || 0, // Ensure valid number
        custName: document.getElementById('custName').value,
        voucherDetails: []
    };

    const itemsContainer = document.getElementById('voucherItems');
    const itemDivs = itemsContainer.querySelectorAll('.border');

    itemDivs.forEach((itemDiv, index) => {
        // Retrieve input values for each item and validate
        const jewelryName = document.getElementById(`itemName${index}`).value;
        const grossWeight = parseFloat(document.getElementById(`grossWeight${index}`).value) || 0;
        const netWeight = parseFloat(document.getElementById(`netWeight${index}`).value) || 0;
        const fineWeight = parseFloat(document.getElementById(`fineWeight${index}`).value) || 0;
        const rate = parseFloat(document.getElementById(`rate${index}`).value) || 0;
        const amount = parseFloat(document.getElementById(`amount${index}`).value) || 0;

        // Ensure all fields have valid values before adding to voucherDetails
        if (jewelryName && grossWeight && netWeight && fineWeight && rate && amount) {
            updatedVoucher.voucherDetails.push({
                jewelryName,
                grossWeight,
                netWeight,
                fineWeight,
                rate,
                amount
            });
        } else {
            console.error(`Missing or invalid data for item ${index + 1}`);
        }
    });

    // Send updated voucher data to the server
    fetch(`http://localhost:8082/api/vouchers/${updatedVoucher.billRefNo}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedVoucher)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save voucher');
            }
            alert('Voucher updated successfully!');
            // Notify parent window to refresh the list
            window.opener.postMessage({ action: 'update', refNo: updatedVoucher.billRefNo }, '*');
            window.close();
        })
        .catch(error => {
            console.error('Error saving voucher:', error);
            alert('Failed to save voucher.');
        });
}


// function saveVoucher() {
//     const updatedVoucher = {
//         billRefNo: document.getElementById('billRefNo').value,
//         date: document.getElementById('date').value,
//         totalAmount: parseFloat(document.getElementById('totalAmount').value),
//         custName: document.getElementById('custName').value,
//         voucherDetails: []
//     };

//     const itemsContainer = document.getElementById('voucherItems');
//     const itemDivs = itemsContainer.querySelectorAll('.border');

//     itemDivs.forEach((itemDiv, index) => {
//         updatedVoucher.voucherDetails.push({
//             jewelryName: document.getElementById(`itemName${index}`).value,
//             grossWeight: parseFloat(document.getElementById(`grossWeight${index}`).value),
//             netWeight: parseFloat(document.getElementById(`netWeight${index}`).value),
//             fineWeight: parseFloat(document.getElementById(`fineWeight${index}`).value),
//             rate: parseFloat(document.getElementById(`rate${index}`).value),
//             amount: parseFloat(document.getElementById(`amount${index}`).value)
//         });
//     });

//     fetch(`http://localhost:8082/api/vouchers/${updatedVoucher.billRefNo}`, {
//         method: 'PUT',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(updatedVoucher)
//     })
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Failed to save voucher');
//             }
//             alert('Voucher updated successfully!');
//             // Notify parent window to refresh the list
//             window.opener.postMessage({ action: 'update', refNo: updatedVoucher.billRefNo }, '*');
//             window.close();
//         })
//         .catch(error => {
//             console.error('Error saving voucher:', error);
//             alert('Failed to save voucher.');
//         });
// }

function deleteVoucher() {
    const refNo = document.getElementById('billRefNo').value;

    fetch(`http://localhost:8082/api/vouchers/${refNo}`, {
        method: 'DELETE'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete voucher');
            }
            alert('Voucher deleted successfully!');
            // Notify parent window to refresh the list
            window.opener.postMessage({ action: 'delete', refNo: refNo }, '*');
            window.close();
        })
        .catch(error => {
            console.error('Error deleting voucher:', error);
            alert('Failed to delete voucher.');
        });
}






