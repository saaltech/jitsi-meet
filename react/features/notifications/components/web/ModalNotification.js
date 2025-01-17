import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';

const styles = (theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(2)
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
});

const DialogTitle = withStyles(styles)((props) => {
  const { children, classes, onClose, ...other } = props;
  return (
    <MuiDialogTitle disableTypography className={classes.root} {...other}>
      <Typography variant="h5">{children}</Typography>
      {onClose ? (
        <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      ) : null}
    </MuiDialogTitle>
  );
});

const DialogContent = withStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
  },
}))(MuiDialogContent);

const DialogActions = withStyles((theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1)
  },
}))(MuiDialogActions);

const ButtonActions = withStyles((theme) => ({
  root: {
    textTransform: "none",
    background: "#ebebeb",
    color: "#444",
    display: "inline-flex",
    borderRadius: "20px",
    border: "1px solid #ebebeb",
    marginRight: "10px"
  },
}))(Button);

export default function ModalNotification(props) {
  const [open, setOpen] = React.useState(true);
  const { actions = [], description, title, onDismissed} = props;

  const handleClose = () => {
    onDismissed();
    setOpen(false);
  };

  return (
    <div>
      <Dialog onClose={handleClose} aria-labelledby="customized-dialog-title" open={open}
        fullWidth={true}>
        {
          title &&
          <DialogTitle id="customized-dialog-title" onClose={handleClose}>
            { title }
          </DialogTitle>
        }
        <DialogContent dividers>
          <Typography gutterBottom>
            { description }
          </Typography>
        </DialogContent>
        { actions && actions.length > 0 
          && <DialogActions>
            {
                actions.map((action, index) => 
                    <ButtonActions autoFocus 
                      onClick={action.onClick} 
                      color="primary"
                      key = {index}>
                        { action.content }
                    </ButtonActions>
                )
            }
          </DialogActions>
        }
      </Dialog>
    </div>
  );
}
