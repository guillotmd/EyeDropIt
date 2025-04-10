import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { MedicationProvider } from "@/contexts/MedicationContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Schedule from "@/pages/Schedule";
import Medications from "@/pages/Medications";
import Profile from "@/pages/Profile";
import AddMedication from "@/pages/AddMedication";
import EditMedication from "@/pages/EditMedication";
import AddDose from "@/pages/AddDose";
import AddAppointment from "@/pages/AddAppointment";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/schedule" component={Schedule} />
      <Route path="/medications" component={Medications} />
      <Route path="/profile" component={Profile} />
      <Route path="/add-medication" component={AddMedication} />
      <Route path="/edit-medication/:id" component={EditMedication} />
      <Route path="/add-dose" component={AddDose} />
      <Route path="/add-appointment" component={AddAppointment} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <MedicationProvider>
      <Router />
      <Toaster />
    </MedicationProvider>
  );
}

export default App;
