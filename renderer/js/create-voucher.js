console.log("this file is running crete voucher");

document.getElementById('addRow').addEventListener('click', function() {
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td><input type="text" class="form-control" name="jewelryName[]"></td>
        <td><input type="number" class="form-control" name="grossWeight[]" step="0.1"></td>
        <td><input type="number" class="form-control" name="netWeight[]" step="0.1"></td>
        <td><input type="number" class="form-control" name="fineWeight[]" step="0.1"></td>
        <td><input type="number" class="form-control" name="rate[]"></td>
        <td><input type="number" class="form-control" name="amount[]" readonly></td>
        <td><button type="button" class="btn btn-danger removeRow">Remove</button></td>
    `;
    document.querySelector('#voucherDetailsTable tbody').appendChild(newRow);
    updateTotals();
});

document.querySelector('#voucherDetailsTable').addEventListener('input', function(e) {
    if (e.target.matches('input[name="grossWeight[]"], input[name="netWeight[]"], input[name="fineWeight[]"], input[name="rate[]"]')) {
        const row = e.target.closest('tr');
        const grossWeight = parseFloat(row.querySelector('input[name="grossWeight[]"]').value) || 0;
        const netWeight = parseFloat(row.querySelector('input[name="netWeight[]"]').value) || 0;
        const fineWeight = parseFloat(row.querySelector('input[name="fineWeight[]"]').value) || 0;
        const rate = parseFloat(row.querySelector('input[name="rate[]"]').value) || 0;
        
        const amount = fineWeight * rate;
        row.querySelector('input[name="amount[]"]').value = amount.toFixed(2);
        updateTotals();
    }
});

document.querySelector('#voucherDetailsTable').addEventListener('click', function(e) {
    if (e.target.classList.contains('removeRow')) {
        e.target.closest('tr').remove();
        updateTotals();
    }
});

function updateTotals() {
    let totalWeight = 0;
    let totalAmount = 0;

    const rows = document.querySelectorAll('#voucherDetailsTable tbody tr');
    rows.forEach(function(row) {
        const grossWeight = parseFloat(row.querySelector('input[name="grossWeight[]"]').value) || 0;
        const amount = parseFloat(row.querySelector('input[name="amount[]"]').value) || 0;
        
        totalWeight += grossWeight;
        totalAmount += amount;
    });

    document.getElementById('totalWeight').textContent = totalWeight.toFixed(2);
    document.getElementById('totalAmountCell').textContent = totalAmount.toFixed(2);
}

document.getElementById('voucherForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const voucherData = {
        billRefNo: document.getElementById('billRefNo').value,
        date: document.getElementById('date').value,
        totalAmount: parseFloat(document.getElementById('totalAmount').value),
        billType: document.querySelector('input[name="billType"]:checked').value,
        metalType: document.getElementById('metalType').value,
        custName: document.getElementById('custName').value,
        custPhone: document.getElementById('custPhone').value,
        address: document.getElementById('address').value,
        modeOfPayment: document.getElementById('modeOfPayment').value,
        billRate: parseFloat(document.getElementById('billRate').value),
        avgWeight: parseFloat(document.getElementById('avgWeight').value),
        voucherDetails: []
    };

    const rows = document.querySelectorAll('#voucherDetailsTable tbody tr');
    rows.forEach(function(row) {
        voucherData.voucherDetails.push({
            date: document.getElementById('date').value,
            billType: document.querySelector('input[name="billType"]:checked').value,
            jewelryName: row.querySelector('input[name="jewelryName[]"]').value,
            grossWeight: parseFloat(row.querySelector('input[name="grossWeight[]"]').value),
            netWeight: parseFloat(row.querySelector('input[name="netWeight[]"]').value),
            fineWeight: parseFloat(row.querySelector('input[name="fineWeight[]"]').value),
            rate: parseFloat(row.querySelector('input[name="rate[]"]').value),
            amount: parseFloat(row.querySelector('input[name="amount[]"]').value)
        });
    });

    fetch('http://localhost:8082/api/vouchers/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(voucherData),
    })
    .then(response => response.json())
    .then(data => {
        alert('Voucher created successfully');
        document.getElementById('voucherForm').reset();
        document.querySelector('#voucherDetailsTable tbody').innerHTML = '';
        updateTotals();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to create voucher');
    });
});
