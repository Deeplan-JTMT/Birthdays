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
