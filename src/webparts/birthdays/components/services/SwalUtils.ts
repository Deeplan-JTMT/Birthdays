import Swal from "sweetalert2";

export function openErrorModal(error: string) {
    Swal.fire({
        title: error,
        icon: 'error',
        confirmButtonText: 'סגירה',
        target: document.body,
        customClass: {
            container: 'swal'
        }
    })
};

export function openSuccessModal(message: string, closeForm: () => void) {
    Swal.fire({
        title: message,
        icon: 'success',
        confirmButtonText: 'סגירה',
        target: document.body,
        customClass: {
            container: 'swal'
        }
    }).then(result => {
        if (result.isConfirmed) {
            closeForm();            // ← runs ONLY on confirmation
        }
    });
};
