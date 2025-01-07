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
    document.getElementById('billType').value = data.billType;
    document.getElementById('metalType').value = data.metalType;
    document.getElementById('custName').value = data.custName;
    document.getElementById('custPhone').value = data.custPhone;
    document.getElementById('address').value = data.address;
    document.getElementById('modeOfPayment').value = data.modeOfPayment;
    document.getElementById('billRate').value = data.billRate;
    document.getElementById('avgWeight').value = data.avgWeight;

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
                    <td id="totalAmount1">0</td>
                </tr>
            </tfoot>
        </table>
    `;

    updateTotals();
}

function recalculateAmount(index) {
    const fineWeight = parseFloat(document.getElementById(`fineWeight${index}`).value) || 0;
    const rate = parseFloat(document.getElementById(`rate${index}`).value) || 0;

    const amount = fineWeight * rate;
    document.getElementById(`amount${index}`).value = amount;

    updateTotals();
}

function updateTotals() {
    const rows = document.querySelectorAll("#voucherTableBody tr");
    let totalGrossWeight = 0;
    let totalNetWeight = 0;
    let totalFineWeight = 0;
    let totalAmount1 = 0;

    rows.forEach((row, index) => {
        const grossWeight = parseFloat(document.getElementById(`grossWeight${index}`).value) || 0;
        const netWeight = parseFloat(document.getElementById(`netWeight${index}`).value) || 0;
        const fineWeight = parseFloat(document.getElementById(`fineWeight${index}`).value) || 0;
        const amount = parseFloat(document.getElementById(`amount${index}`).value) || 0;

        totalGrossWeight += grossWeight;
        totalNetWeight += netWeight;
        totalFineWeight += fineWeight;
        totalAmount1 += amount;
    });

    document.getElementById('totalGrossWeight').textContent = totalGrossWeight;
    document.getElementById('totalNetWeight').textContent = totalNetWeight;
    document.getElementById('totalFineWeight').textContent = totalFineWeight;
    document.getElementById('totalAmount1').textContent = totalAmount1;

    document.getElementById('totalAmount').value = totalAmount1;
}

function deleteVoucher() {
    const refNo = document.getElementById('billRefNo').value;

    if (confirm('Are you sure you want to delete this voucher?')) {
        fetch(`http://localhost:8082/api/vouchers/${refNo}`, {
            method: 'DELETE',
        })
            .then(response => {
                if (response.ok) {
                    alert('Voucher deleted successfully.');
                    // Notify the parent window and close the current window
                    window.opener.postMessage({ action: 'delete', refNo: refNo }, '*');
                    window.close();
                } else {
                    throw new Error('Failed to delete voucher');
                }
            })
            .catch(error => {
                console.error('Error deleting voucher:', error);
                alert('Error deleting voucher. Please try again.');
            });
    }
}

function saveVoucher() {
    const refNo = document.getElementById('billRefNo').value;
    const updatedVoucher = {
        billRefNo: refNo,
        date: document.getElementById('date').value,
        totalAmount: parseFloat(document.getElementById('totalAmount').value) || 0,
        billType: document.getElementById('billType').value,
        metalType: document.getElementById('metalType').value,
        custName: document.getElementById('custName').value,
        custPhone: document.getElementById('custPhone').value,
        address: document.getElementById('address').value,
        modeOfPayment: document.getElementById('modeOfPayment').value,
        billRate: parseFloat(document.getElementById('billRate').value) || 0,
        avgWeight: parseFloat(document.getElementById('avgWeight').value) || 0,
        voucherDetails: [],
    };

    const rows = document.querySelectorAll("#voucherTableBody tr");
    rows.forEach((row, index) => {
        updatedVoucher.voucherDetails.push({
            jewelryName: document.getElementById(`itemName${index}`).value,
            grossWeight: parseFloat(document.getElementById(`grossWeight${index}`).value) || 0,
            netWeight: parseFloat(document.getElementById(`netWeight${index}`).value) || 0,
            fineWeight: parseFloat(document.getElementById(`fineWeight${index}`).value) || 0,
            rate: parseFloat(document.getElementById(`rate${index}`).value) || 0,
            amount: parseFloat(document.getElementById(`amount${index}`).value) || 0,
        });
    });

    fetch(`http://localhost:8082/api/vouchers/${refNo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedVoucher),
    })
        .then(response => {
            if (response.ok) {
                alert('Voucher updated successfully.');
                // Notify the parent window and close the current window
                window.opener.postMessage({ action: 'update', refNo: refNo }, '*');
                window.close();
            } else {
                throw new Error('Failed to update voucher');
            }
        })
        .catch(error => {
            console.error('Error updating voucher:', error);
            alert('Error updating voucher. Please try again.');
        });
}

