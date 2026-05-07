import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Car, User, Briefcase, ArrowLeft, Printer, CreditCard, Banknote, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Car Wash Manager" },
      { name: "description", content: "Simple car wash management system" },
    ],
  }),
  component: CarWashApp,
});

type Screen =
  | "menu"
  | "customer-services"
  | "customer-payment"
  | "customer-card"
  | "customer-cash"
  | "customer-ticket"
  | "employee-login"
  | "employee-menu"
  | "employee-prices"
  | "employee-sales";

type ServiceKey = "basic" | "wax" | "vacuum";

type Sale = {
  ticket: string;
  total: number;
  services: ServiceKey[];
  paymentMethod: "card" | "cash";
  date: string;
};

const DEFAULT_PRICES: Record<ServiceKey, number> = {
  basic: 100,
  wax: 150,
  vacuum: 120,
};

const SERVICE_LABELS: Record<ServiceKey, string> = {
  basic: "Basic wash",
  wax: "Wax",
  vacuum: "Vacuuming",
};

const EMPLOYEE_USER = "admin";
const EMPLOYEE_PASS = "1234";

function CarWashApp() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [prices, setPrices] = useState<Record<ServiceKey, number>>(DEFAULT_PRICES);
  const [sales, setSales] = useState<Sale[]>([]);

  // Customer flow state
  const [ticketNum, setTicketNum] = useState<number>(0);
  const [selected, setSelected] = useState<Record<ServiceKey, boolean>>({
    basic: false,
    wax: false,
    vacuum: false,
  });
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Employee state
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loginError, setLoginError] = useState("");

  // Persist prices & sales
  useEffect(() => {
    const p = localStorage.getItem("cw_prices");
    const s = localStorage.getItem("cw_sales");
    if (p) setPrices(JSON.parse(p));
    if (s) setSales(JSON.parse(s));
  }, []);

  useEffect(() => {
    localStorage.setItem("cw_prices", JSON.stringify(prices));
  }, [prices]);

  useEffect(() => {
    localStorage.setItem("cw_sales", JSON.stringify(sales));
  }, [sales]);

  const total = useMemo(
    () =>
      (Object.keys(selected) as ServiceKey[]).reduce(
        (sum, k) => sum + (selected[k] ? prices[k] : 0),
        0,
      ),
    [selected, prices],
  );

  const resetCustomer = () => {
    setSelected({ basic: false, wax: false, vacuum: false });
    setCardNumber("");
    setCashAmount("");
    setPaymentMethod("card");
    setCompletedSale(null);
  };

  const goMenu = () => {
    resetCustomer();
    setUser("");
    setPass("");
    setLoginError("");
    setScreen("menu");
  };

  const startCustomer = () => {
    resetCustomer();
    setTicketNum(Math.floor(Math.random() * 9000) + 1000);
    setScreen("customer-services");
  };

  const todaysSales = useMemo(() => {
    const today = new Date();
    const key = `${pad(today.getDate())}${pad(today.getMonth() + 1)}${String(today.getFullYear()).slice(-2)}`;
    return sales.filter((s) => s.ticket.endsWith(key));
  }, [sales]);

  const completePurchase = () => {
    const today = new Date();
    const dayKey = `${pad(today.getDate())}${pad(today.getMonth() + 1)}${String(today.getFullYear()).slice(-2)}`;
    const saleNumber = pad(todaysSales.length + 1);
    const ticket = `0${saleNumber}${dayKey}`;
    const sale: Sale = {
      ticket,
      total,
      services: (Object.keys(selected) as ServiceKey[]).filter((k) => selected[k]),
      paymentMethod,
      date: today.toISOString(),
    };
    setSales((prev) => [...prev, sale]);
    setCompletedSale(sale);
    setScreen("customer-ticket");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {screen === "menu" && (
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <div className="p-3 rounded-full bg-primary/10">
                  <Car className="h-10 w-10 text-primary" />
                </div>
              </div>
              <CardTitle className="text-3xl">Car Wash</CardTitle>
              <CardDescription>Welcome — please choose an option</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button size="lg" className="h-32 text-lg flex-col gap-2" onClick={startCustomer}>
                <User className="h-8 w-8" />
                Customer
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="h-32 text-lg flex-col gap-2"
                onClick={() => setScreen("employee-login")}
              >
                <Briefcase className="h-8 w-8" />
                Employee
              </Button>
            </CardContent>
          </Card>
        )}

        {screen === "customer-services" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={goMenu}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Your ticket</div>
                  <div className="text-2xl font-bold">#{ticketNum}</div>
                </div>
              </div>
              <CardTitle>Select services</CardTitle>
              <CardDescription>Choose one or more options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(Object.keys(prices) as ServiceKey[]).map((k) => (
                <label
                  key={k}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selected[k]}
                      onCheckedChange={(v) => setSelected({ ...selected, [k]: !!v })}
                    />
                    <span className="font-medium">{SERVICE_LABELS[k]}</span>
                  </div>
                  <span className="text-lg font-semibold">${prices[k]}</span>
                </label>
              ))}
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-lg">Total</span>
                <span className="text-2xl font-bold text-primary">${total}</span>
              </div>
              <Button
                className="w-full"
                size="lg"
                disabled={total === 0}
                onClick={() => setScreen("customer-payment")}
              >
                Next
              </Button>
            </CardContent>
          </Card>
        )}

        {screen === "customer-payment" && (
          <Card>
            <CardHeader>
              <Button variant="ghost" size="sm" className="w-fit" onClick={() => setScreen("customer-services")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <CardTitle>Payment method</CardTitle>
              <CardDescription>Total to pay: ${total}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "card" | "cash")}>
                <label className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="card" id="card" />
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium">Card</span>
                </label>
                <label className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="cash" id="cash" />
                  <Banknote className="h-5 w-5" />
                  <span className="font-medium">Cash</span>
                </label>
              </RadioGroup>
              <Button
                className="w-full"
                size="lg"
                onClick={() => setScreen(paymentMethod === "card" ? "customer-card" : "customer-cash")}
              >
                Next
              </Button>
            </CardContent>
          </Card>
        )}

        {screen === "customer-card" && (
          <Card>
            <CardHeader>
              <Button variant="ghost" size="sm" className="w-fit" onClick={() => setScreen("customer-payment")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <CardTitle>Card payment</CardTitle>
              <CardDescription>Enter your 16-digit card number</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="card">Card number</Label>
                <Input
                  id="card"
                  inputMode="numeric"
                  maxLength={16}
                  placeholder="1234567890123456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <Button
                className="w-full"
                size="lg"
                disabled={cardNumber.length !== 16}
                onClick={completePurchase}
              >
                Next
              </Button>
            </CardContent>
          </Card>
        )}

        {screen === "customer-cash" && (
          <CashScreen
            total={total}
            cashAmount={cashAmount}
            setCashAmount={setCashAmount}
            onBack={() => setScreen("customer-payment")}
            onNext={completePurchase}
          />
        )}

        {screen === "customer-ticket" && completedSale && (
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <div className="p-3 rounded-full bg-primary/10">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
              </div>
              <CardTitle>Thank you!</CardTitle>
              <CardDescription>Your ticket is ready</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-6 space-y-2 font-mono">
                <div className="text-center text-xl font-bold">CAR WASH</div>
                <div className="text-center text-sm">Ticket: {completedSale.ticket}</div>
                <div className="border-t my-2" />
                {completedSale.services.map((s) => (
                  <div key={s} className="flex justify-between">
                    <span>{SERVICE_LABELS[s]}</span>
                    <span>${prices[s]}</span>
                  </div>
                ))}
                <div className="border-t my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${completedSale.total}</span>
                </div>
                <div className="text-xs text-center mt-3">
                  Paid with {completedSale.paymentMethod}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-1" /> Print
                </Button>
                <Button className="flex-1" onClick={goMenu}>
                  Finish
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {screen === "employee-login" && (
          <Card>
            <CardHeader>
              <Button variant="ghost" size="sm" className="w-fit" onClick={goMenu}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <CardTitle>Employee login</CardTitle>
              <CardDescription>Enter your credentials (admin / 1234)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="user">Username</Label>
                <Input id="user" value={user} onChange={(e) => setUser(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pass">Password</Label>
                <Input
                  id="pass"
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                />
              </div>
              {loginError && <p className="text-sm text-destructive">{loginError}</p>}
              <Button
                className="w-full"
                onClick={() => {
                  if (user === EMPLOYEE_USER && pass === EMPLOYEE_PASS) {
                    setLoginError("");
                    setScreen("employee-menu");
                  } else {
                    setLoginError("Invalid credentials");
                  }
                }}
              >
                Login
              </Button>
            </CardContent>
          </Card>
        )}

        {screen === "employee-menu" && (
          <Card>
            <CardHeader>
              <CardTitle>Employee panel</CardTitle>
              <CardDescription>Choose an option</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button size="lg" onClick={() => setScreen("employee-prices")}>
                Manage prices
              </Button>
              <Button size="lg" variant="secondary" onClick={() => setScreen("employee-sales")}>
                View today's sales
              </Button>
              <Button size="lg" variant="outline" onClick={goMenu}>
                Return to menu
              </Button>
            </CardContent>
          </Card>
        )}

        {screen === "employee-prices" && (
          <Card>
            <CardHeader>
              <Button variant="ghost" size="sm" className="w-fit" onClick={() => setScreen("employee-menu")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <CardTitle>Manage prices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(Object.keys(prices) as ServiceKey[]).map((k) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <Label className="flex-1">{SERVICE_LABELS[k]}</Label>
                  <Input
                    type="number"
                    className="w-32"
                    value={prices[k]}
                    onChange={(e) =>
                      setPrices({ ...prices, [k]: Math.max(0, Number(e.target.value) || 0) })
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {screen === "employee-sales" && (
          <Card>
            <CardHeader>
              <Button variant="ghost" size="sm" className="w-fit" onClick={() => setScreen("employee-menu")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <CardTitle>Today's sales</CardTitle>
              <CardDescription>
                {todaysSales.length} sales — Total: $
                {todaysSales.reduce((s, x) => s + x.total, 0)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todaysSales.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sales yet today.</p>
              ) : (
                <div className="space-y-2">
                  {todaysSales.map((s) => (
                    <div
                      key={s.ticket}
                      className="flex justify-between items-center p-3 rounded border font-mono text-sm"
                    >
                      <span>{s.ticket}</span>
                      <span>${s.total}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function CashScreen({
  total,
  cashAmount,
  setCashAmount,
  onBack,
  onNext,
}: {
  total: number;
  cashAmount: string;
  setCashAmount: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const amount = Number(cashAmount) || 0;
  const insufficient = cashAmount !== "" && amount < total;
  const change = amount - total;

  return (
    <Card>
      <CardHeader>
        <Button variant="ghost" size="sm" className="w-fit" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <CardTitle>Cash payment</CardTitle>
        <CardDescription>Total to pay: ${total}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="cash">Amount paid</Label>
          <Input
            id="cash"
            type="number"
            min={0}
            value={cashAmount}
            onChange={(e) => setCashAmount(e.target.value)}
          />
        </div>
        {insufficient && (
          <p className="text-sm text-destructive">
            Insufficient amount. Please enter at least ${total}.
          </p>
        )}
        {!insufficient && cashAmount !== "" && change > 0 && (
          <p className="text-sm font-medium">Change: ${change}</p>
        )}
        {!insufficient && cashAmount !== "" && change === 0 && (
          <p className="text-sm font-medium text-primary">Exact amount</p>
        )}
        <Button
          className="w-full"
          size="lg"
          disabled={cashAmount === "" || insufficient}
          onClick={onNext}
        >
          Next
        </Button>
      </CardContent>
    </Card>
  );
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}
