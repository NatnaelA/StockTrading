import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "@/hooks/useAuth";
import { createTicket, getTickets } from "@/services/zendeskService";
import SupportPage from "../page";

// Mock dependencies
jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/services/zendeskService", () => ({
  createTicket: jest.fn(),
  getTickets: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("Support Page Integration", () => {
  const mockUser = {
    id: "test-user-id",
    email: "test@example.com",
    role: "user",
  };

  const mockTickets = [
    {
      id: "ticket-1",
      subject: "Test Ticket 1",
      category: "technical",
      status: "open",
      priority: "high",
      createdAt: new Date("2024-02-20T10:00:00Z"),
      userId: "test-user-id",
      userEmail: "test@example.com",
      description: "Test description",
      zendeskId: "zendesk-1",
      updatedAt: new Date("2024-02-20T10:00:00Z"),
    },
  ];

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (getTickets as jest.Mock).mockResolvedValue(mockTickets);
    (createTicket as jest.Mock).mockResolvedValue({
      id: "new-ticket-id",
      status: "open",
    });
  });

  it("displays existing tickets and allows creating new ones", async () => {
    render(<SupportPage />);

    // Verify existing tickets are displayed
    await waitFor(() => {
      expect(screen.getByText("Test Ticket 1")).toBeInTheDocument();
    });

    // Open new ticket form
    await userEvent.click(screen.getByText("support.createTicket"));

    // Fill out the form
    await userEvent.selectOptions(
      screen.getByLabelText("support.category"),
      "technical"
    );
    await userEvent.type(
      screen.getByLabelText("support.subject"),
      "New Test Ticket"
    );
    await userEvent.type(
      screen.getByLabelText("support.description"),
      "New test description"
    );
    await userEvent.selectOptions(
      screen.getByLabelText("support.priority"),
      "high"
    );

    // Submit the form
    await userEvent.click(
      screen.getByRole("button", { name: "support.submitTicket" })
    );

    // Verify ticket creation
    await waitFor(() => {
      expect(createTicket).toHaveBeenCalledWith(
        {
          category: "technical",
          subject: "New Test Ticket",
          description: "New test description",
          priority: "high",
        },
        mockUser
      );
    });

    // Verify success message
    expect(screen.getByText("support.ticketCreated")).toBeInTheDocument();
  });

  it("filters tickets correctly", async () => {
    render(<SupportPage />);

    // Open filters
    await userEvent.click(screen.getByText("support.filters"));

    // Apply status filter
    await userEvent.selectOptions(
      screen.getByLabelText("support.status"),
      "open"
    );

    // Verify getTickets was called with correct filters
    await waitFor(() => {
      expect(getTickets).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ["open"],
        })
      );
    });
  });

  it("handles error states gracefully", async () => {
    const error = new Error("Failed to fetch tickets");
    (getTickets as jest.Mock).mockRejectedValue(error);

    render(<SupportPage />);

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText("Failed to fetch tickets")).toBeInTheDocument();
    });
  });
});
