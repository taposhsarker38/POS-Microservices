import Swal from 'sweetalert2';

interface DeleteConfirmOptions {
  title?: string;
  text?: string;
  entityName?: string;
  confirmButtonText?: string;
  successTitle?: string;
  successText?: string;
}

export const confirmDelete = async (options?: DeleteConfirmOptions) => {
  const {
    title = 'Are you sure?',
    text = "You won't be able to revert this!",
    confirmButtonText = 'Yes, delete it!',
  } = options || {};

  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText,
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    focusCancel: true
  });

  return result.isConfirmed;
};

export const showDeleteSuccess = async (options?: DeleteConfirmOptions) => {
  const {
    successTitle = 'Deleted!',
    successText = 'The item has been deleted successfully.',
    entityName
  } = options || {};

  await Swal.fire({
    title: successTitle,
    text: entityName ? `${entityName} has been deleted successfully.` : successText,
    icon: 'success',
    confirmButtonColor: '#10b981',
    timer: 2000,
    showConfirmButton: false
  });
};

export const showDeleteError = async (error?: any) => {
  await Swal.fire({
    title: 'Error!',
    text: error?.data?.message || error?.message || 'Failed to delete. Please try again.',
    icon: 'error',
    confirmButtonColor: '#ef4444'
  });
};


const handleDeleteUser = async (id: string) => {
  const confirmed = await confirmDelete({
    title: 'Delete User?',
    text: 'This user will be permanently removed from the system.',
    entityName: 'User'
  });

  if (confirmed) {
    try {
      await deleteUser(id).unwrap();
      await showDeleteSuccess({ entityName: 'User' });
    } catch (error) {
      await showDeleteError(error);
    }
  }
};

const handleDeleteProject = async (id: string) => {
  const confirmed = await confirmDelete({
    title: 'Delete Project?',
    text: 'All associated tasks and files will also be deleted!',
    confirmButtonText: 'Yes, delete project'
  });

  if (confirmed) {
    try {
      await deleteProject(id).unwrap();
      await showDeleteSuccess({
        successTitle: 'Project Deleted!',
        successText: 'The project and all its data have been removed.'
      });
    } catch (error) {
      await showDeleteError(error);
    }
  }
};

const handleDeleteMinimal = async (id: string) => {
  const confirmed = await confirmDelete();
  
  if (confirmed) {
    try {
      await deleteCompany(id).unwrap();
    } catch (error) {
      await showDeleteError(error);
    }
  }
};